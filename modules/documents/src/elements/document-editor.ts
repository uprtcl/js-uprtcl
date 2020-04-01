import { LitElement, property, html, css } from 'lit-element';

export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Hashed, Pattern, Creatable, Signed, HasChildren } from '@uprtcl/cortex';
import { ApolloClientModule, gql, ApolloClient } from '@uprtcl/graphql';
import { Lens } from '@uprtcl/lenses';
import { EveesRemote, EveesModule, RemotesConfig, CreateCommitArgs, EveesBindings, CreatePerspectiveArgs, Perspective, Commit } from '@uprtcl/evees';
import { Source } from '@uprtcl/multiplatform';

import { KeypressAtEvent, KEYPRESS_AT_TAG } from './events';
import { TextType, DocNode } from 'src/types';

export class DocumentEditor extends moduleConnect(LitElement) {

  logger = new Logger('DOCUMENT-EDITOR');

  @property({ type: String })
  ref: string | undefined = undefined;

  @property({ type: Object, attribute: false })
  doc: DocNode | undefined = undefined;

  protected client: ApolloClient<any> | undefined = undefined;
  protected eveesRemotes: EveesRemote[] | undefined = undefined;
  protected remotesConfig: RemotesConfig | undefined = undefined;

  firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.remotesConfig = this.request(EveesModule.bindings.RemotesConfig);
    
    this.loadDoc();
  }

  async loadDoc() {
    if (!this.ref) return;
    this.doc = await this.loadNodeRec(this.ref, [0]);
  }

  async loadNodeRec(ref: string, path: number[], parent?: DocNode) : Promise<DocNode>  {
    const node = await this.loadNode(ref, path);
    
    const loadChildren = node.hasChildren.getChildrenLinks(node.data).map(async (child, ix): Promise<DocNode> => {
      return this.loadNodeRec(child, path.concat([ix]), node);
    })

    node.parent = parent;
    node.childrenNodes = await Promise.all(loadChildren);

    return node;
  }

  async loadNode(ref: string, path: number[]) : Promise<DocNode> {
    const client = this.client as ApolloClient<any>;

    const result = await client.query({
      query: gql`
      {
        entity(id: "${ref}") {
          id
          ... on Perspective {
            payload {
              origin
            }
            head {
              id 
              data {
                id
                ... on TextNode {
                  text
                  type
                  links
                }
              }
            }
          }
          _context {
            patterns {
              accessControl {
                canWrite
              }
              hasChildren {
                getChildren
              }
            }
          }
        }
      }`
    });

    const editable = result.data.entity._context.patterns.accessControl.canWrite;
    const data = result.data.entity.head.data;
    const origin = result.data.entity.payload.origin;
    const docNodeLenses = result.data.entity._context.patterns.hasDocNodeLenses.docNodeLenses;
    const hasChildren = result.data.entity._context.patterns.hasChildren;

    const node: DocNode = {
      ref: ref,
      path: path,
      hasChildren: hasChildren,
      childrenNodes: [],
      data: data,
      docNodeLenses: docNodeLenses,
      editable: editable,
      authority: origin,
      focused: false
    }

    return node;
  }

  getNodeAt(path: number[]) : DocNode {
    if (!this.doc) throw new Error(`node not found at ${path}`);

    let node = this.doc;
    /** path always starts with [0] */
    path.shift();

    /** visit the node children for every*/
    while(path.length > 0) {
      const ix = path.shift();
      if (!ix) throw new Error(`node not found at ${path}`);
      node = node.childrenNodes[ix];
    }

    return node;    
  }

  defaultEntity(text: string, type: TextType) {
    /** init a node with the provided text guranteeing either the <p> or <h1> external tag
     *  is consistent with the request type */
    let newText;
    if (type === TextType.Paragraph) {
      newText = `<p>${text}</p>`
    } else {
      newText = `<h1>${text}</h1>`
    }

    return { 
      data: {
        text: newText,
        type: type,
        links: []
      },
      symbol: 'Symbold'
    }
  }

  getCreatePatternOfSymbol(symbol: symbol) {
    this.logger.log(`getCreatePatternOfSymbol(${symbol.toString()})`);

    const patterns: Pattern[] = this.requestAll(symbol);
    const create: Creatable<any, any> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as Creatable<any, any>).create
    ) as unknown) as Creatable<any, any>;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
  }

  getStore(eveesAuthority: string): Source | undefined {
    if (!this.remotesConfig) return undefined;
    return this.remotesConfig.map(eveesAuthority);
  }

  async createEvee(content: object, symbol: symbol, authority: string): Promise<string> {
    if (!this.eveesRemotes) throw new Error('eveesRemotes undefined');

    const remote = this.eveesRemotes.find(r => r.authority === authority);

    if (!remote) throw new Error(`Remote not found for authority ${authority}`);

    const creatable = this.getCreatePatternOfSymbol(symbol);
    const store = this.getStore(authority);
    if (!store) throw new Error('store is undefined');
    const object = await creatable.create()(content, store.source);

    const creatableCommit: Creatable<CreateCommitArgs, Signed<Commit>> = this.getCreatePatternOfSymbol(
      EveesBindings.CommitPattern
    );
    const commit = await creatableCommit.create()(
      {
        parentsIds: [],
        dataId: object.id
      },
      remote.source
    );

    const creatablePerspective: Creatable<
      CreatePerspectiveArgs,
      Signed<Perspective>
    > = this.getCreatePatternOfSymbol(EveesBindings.PerspectivePattern);

    const perspective = await creatablePerspective.create()(
      {
        fromDetails: {
          headId: commit.id
        },
        parentId: this.ref
      },
      authority
    );

    return perspective.id;
  }

  /** node updated as reference */
  async spliceChildren(path: number[], elements: any[] = [], index?: number, count: number = 0): Promise<string[]> {
    const node = this.getNodeAt(path);
    
    const currentChildren = node.hasChildren.getChildrenLinks(node.data);
    index = index !== undefined ? index : currentChildren.length;

    /** create objects if elements is not an id */
    const create = elements.map(el => {
      if (typeof el !== 'string') {
        return this.createEvee(el.object, el.symbol, node.authority);
      } else {
        return Promise.resolve(el);
      }
    })

    const elementsIds = await Promise.all(create);
    const getNewNodes = elementsIds.map(async (ref, ix) => {
      return this.loadNodeRec(ref, path.concat([(index as number) + ix]));
    });
    const newNodes = await Promise.all(getNewNodes);

    let newChildren = [...currentChildren];
    const removed = newChildren.splice(index, count, ...elementsIds);
    node.childrenNodes.splice(index, count, ...newNodes);
    node.data = node.hasChildren.replaceChildrenLinks(node.data)(newChildren);

    return removed;
  }

  async createChildAt(path: number[], newEntity: any, symbol: symbol, index?: number) {
    const doc = this.doc as DocNode;
    const node = this.getNodeAt(path);
    
    const newLink = await this.createEvee(newEntity, symbol, node.authority);
    await this.spliceChildren(path, [newLink], 0);
  }

  scheduleUpdate() {
    throw new Error('TBD');
  }

  focused(path: number[]) {
    const node = this.getNodeAt(path);
    node.focused = true;
    this.scheduleUpdate();
  }

  blured(path: number[]) {
    const node = this.getNodeAt(path);
    node.focused = false;
    this.scheduleUpdate();
  }

  focusBackward(path: number[]) {
    const node = this.getNodeAt(path);
    const backwardNode = this.getBackwardNodeAt(path);
    node.focused = false;
    backwardNode.focused = true;
  }

  contentChanged(path: number[], content: any) {
    const node = this.getNodeAt(path);
    node.data = content;
    // TODO: persist change
    this.scheduleUpdate();
  }
  
  renderWithCortex(node: DocNode) {
    return html`<cortex-entity hash=${node.ref}></cortex-entity>`;
  }

  renderTopRow(node: DocNode) {

    /** the ref to which the parent is pointing at */
    const firstRef = node.parent ? node.parent.childrenNodes[node.path[node.path.length - 1]].ref : node.ref;
    const color = 'red';
    
    return html`
      <div class="row" style=${styleMap({ backgroundColor: node.focused ? '#f7f6f3' : 'transparent' })}>
        <div class="column">
          <div class="evee-info">
            <evees-info-popper 
              firstPerspectiveId=${firstRef}
              perspectiveId=${node.ref}
              eveeColor=${color}
            ></evees-info-popper>
          </div>
          <div class="node-content">
            ${node.docNodeLenses[0].render(node, {
              focus: () => this.focused(node.path),
              blur: () => this.blured(node.path),
              contentChanged: (content: any) => this.contentChanged(node.path, content),
              focusBackward: () => this.focusBackward(node.path),
              focusDownward: () => this.focusDownward(node.path),
              joinBackward: (tail: string) => this.focusDownward(node.path, tail),
              lift: () => this.lift(node.path),
              push: () => this.push(node.path),
              split: (tail: string) => this.split(node.path, tail),
            })}
          </div>
        </div>
      </div>
    `;
  }


  renderHere(node: DocNode) {
    return html`
      ${this.renderTopRow(node)}
      ${node.childrenNodes ? node.childrenNodes.map((child) => {
        return this.renderDocNode(child);
      }) : ''}
    `;
  }

  renderDocNode(node: DocNode) {
    return node.topLenses.length > 0 ? 
      this.renderHere(node) : 
      this.renderWithCortex(node);
  }

  render() {
    if (!this.doc) return '';
    return this.renderDocNode(this.doc);
  }

  static get styles() {
    return css`
      .column {
        display: flex;
        flex-direction: row;
      }
    `;
  }
}
