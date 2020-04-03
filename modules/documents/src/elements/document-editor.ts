import { LitElement, property, html, css } from 'lit-element';

export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Hashed, Pattern, Creatable, Signed, HasChildren, CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { ApolloClientModule, gql, ApolloClient } from '@uprtcl/graphql';
import { Lens } from '@uprtcl/lenses';
import { EveesRemote, EveesModule, RemotesConfig, CreateCommitArgs, EveesBindings, CreatePerspectiveArgs, Perspective, Commit, Secured, UPDATE_HEAD, ContentUpdatedEvent } from '@uprtcl/evees';
import { Source, DiscoveryModule, DiscoveryService } from '@uprtcl/multiplatform';

import { KeypressAtEvent, KEYPRESS_AT_TAG } from './events';
import { TextType, DocNode } from 'src/types';
import { HasDocNodeLenses } from 'src/patterns/document-patterns';
import { DocumentsBindings } from 'src/bindings';
import { timingSafeEqual } from 'crypto';
import { icons } from './prosemirror/icons';

export class DocumentEditor extends moduleConnect(LitElement) {

  logger = new Logger('DOCUMENT-EDITOR');

  @property({ type: String })
  ref: string | undefined = undefined;

  @property({ type: Object, attribute: false })
  doc: DocNode | undefined = undefined;

  protected client: ApolloClient<any> | undefined = undefined;
  protected eveesRemotes: EveesRemote[] | undefined = undefined;
  protected remotesConfig: RemotesConfig | undefined = undefined;
  protected discovery: DiscoveryService | undefined = undefined;
  protected recognizer: PatternRecognizer | undefined = undefined;
  
  firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.remotesConfig = this.request(EveesModule.bindings.RemotesConfig);
    this.discovery = this.request(DiscoveryModule.bindings.DiscoveryService);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    this.logger.log('firstUpdated()', this.ref)

    this.loadDoc();
  }

  updated(changedProperties) {
    this.logger.log('updated()', {ref: this.ref, changedProperties})
    
    if (changedProperties.has('ref')) {
      this.loadDoc();
    }
  }

  async loadDoc() {
    this.logger.log('loadDoc()', this.ref);

    if (!this.ref) return;
    this.doc = await this.loadNodeRec(this.ref, [0]);
  }

  async loadNodeRec(ref: string, path: number[], parent?: DocNode) : Promise<DocNode>  {
    this.logger.log('loadNodeRec()', {ref, path, parent});

    const node = await this.loadNode(ref, path);
    
    const loadChildren = node.hasChildren.getChildrenLinks(node.draft).map(async (child, ix): Promise<DocNode> => {
      return this.loadNodeRec(child, path.concat([ix]), node);
    })

    node.parent = parent;
    node.childrenNodes = await Promise.all(loadChildren);

    return node;
  }

  async loadNode(ref: string, path: number[]) : Promise<DocNode> {
    this.logger.log('loadNode()', {ref, path});

    const client = this.client as ApolloClient<any>;
    const discovery = this.discovery as DiscoveryService;

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
              ... on Commit {
                data {
                  id
                }
              }
            }
          }
          _context {
            patterns {
              accessControl {
                canWrite
              }
            }
          }
        }
      }`
    });

    const dataId = result.data.entity.head.data.id;
    const headId = result.data.entity.head.id;

    // TODO get data and patterns hasChildren/hasDocNodeLenses from query
    const data = await discovery.get(dataId);
    if (!data) throw Error('Data undefined');

    const hasChildren = this.getPatternOfObject<HasChildren>(data.object, 'getChildrenLinks');
    if (!data) throw Error('hasChildren undefined');

    const hasDocNodeLenses = this.getPatternOfObject<HasDocNodeLenses>(data.object, 'docNodeLenses');
    if (!hasDocNodeLenses) throw Error('docNodeLenses undefined');

    // TODO hasChildren hasDocNodeLenses on runtime are the same object :)

    const editable = result.data.entity._context.patterns.accessControl.canWrite;
    const origin = result.data.entity.payload.origin;
    
    const node: DocNode = {
      ref: ref,
      path: path,
      hasChildren: hasChildren,
      childrenNodes: [],
      data: data,
      draft: {...data.object},
      headId: headId,
      symbol: DocumentsBindings.TextNodeEntity, // TODO: Derive symbol from pattern ?
      hasDocNodeLenses: hasDocNodeLenses,
      editable: editable,
      authority: origin,
      focused: false
    }
    
    this.logger.log('loadNode() post', {ref, path, node});

    return node;
  }

  getPatternOfObject<T>(object: object, patternName: string): T {
    const recognizer = this.recognizer as PatternRecognizer
    const pattern: T | undefined = recognizer
      .recognize(object)
      .find(prop => !!(prop as T)[patternName]);

    if (!pattern) throw new Error(`No "${patternName}" pattern registered for object ${JSON.stringify(object)}`);
    return pattern;
  }


  getNodeAt(path: number[]) : DocNode {
    if (!this.doc) throw new Error(`node not found at ${path}`);

    let node = this.doc;
    /** path always starts with [0] */
    path.shift();

    /** visit the node children for every*/
    while(path.length > 0) {
      let ix = path.shift();
      if (ix === undefined) throw new Error(`node not found at ${path}`);
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
      symbol: DocumentsBindings.TextNodeEntity
    }
  }

  getPatternOfSymbol<T>(symbol: symbol, name: string) {
    this.logger.log(`getPatternOfSymbol(${symbol.toString()})`);

    const patterns: Pattern[] = this.requestAll(symbol);
    const create: T | undefined = (patterns.find(
      pattern => ((pattern as unknown) as T)[name]
    ) as unknown) as T;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
  }

  getStore(eveesAuthority: string): Source | undefined {
    if (!this.remotesConfig) return undefined;
    return this.remotesConfig.map(eveesAuthority);
  }

  async createEntity<T>(content: object, symbol: symbol, authority: string): Promise<Hashed<T>> {
    const creatable: Creatable<any, any> | undefined = this.getPatternOfSymbol<Creatable<any,any>>(symbol, 'create');
    if (creatable === undefined) throw new Error('Creatable pattern not found for this entity');
    const store = this.getStore(authority);
    if (!store) throw new Error('store is undefined');
    return creatable.create()(content, store.source);
  }

  async commitAll() {
    if (!this.doc) return;
    this.commitNodeRec(this.doc);
  }

  async commitNodeRec(node: DocNode) {
    const commitChildren = node.childrenNodes.map(child => this.commitNodeRec(child));
    await Promise.all(commitChildren);
    await this.commitDraft(node);
  }

  async commitDraft(node: DocNode): Promise<void> {
    const eveesRemotes = this.eveesRemotes as EveesRemote[];
    const client = this.client as ApolloClient<any>;
    
    const object = await this.createEntity(node.draft, node.symbol, node.authority);
    const remote = eveesRemotes.find(r => r.authority === node.authority);
    if (!remote) throw new Error('remote undefined');;

    const creatableCommit: Creatable<CreateCommitArgs, Signed<Commit>> = this.getPatternOfSymbol<Creatable<any,any>>(EveesModule.bindings.CommitPattern, 'create');
    
    const commit: Secured<Commit> = await creatableCommit.create()(
      {
        parentsIds: node.headId ? [node.headId] : [],
        dataId: object.id
      },
      remote.source
    );

    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.ref,
        headId: commit.id
      }
    });
  }

  async createEvee(content: object, symbol: symbol, authority: string): Promise<string> {
    this.logger.log('createEvee()', {content, symbol, authority});

    if (!this.eveesRemotes) throw new Error('eveesRemotes undefined');
    const remote = this.eveesRemotes.find(r => r.authority === authority);

    if (!remote) throw new Error(`Remote not found for authority ${authority}`);

    const creatable = this.getPatternOfSymbol<Creatable<any,any>>(symbol, 'create');
    const store = this.getStore(authority);
    if (!store) throw new Error('store is undefined');
    const object = await creatable.create()(content, store.source);

    const creatableCommit = this.getPatternOfSymbol<Creatable<any,any>>(EveesBindings.CommitPattern, 'create');
    const commit = await creatableCommit.create()(
      { parentsIds: [], dataId: object.id },
      remote.source
    );

    const creatablePerspective = this.getPatternOfSymbol<Creatable<any,any>>(EveesBindings.PerspectivePattern, 'create');
    const perspective = await creatablePerspective.create()(
      { fromDetails: { headId: commit.id} , parentId: this.ref },
      authority
    );

    return perspective.id;
  }

  createPlaceholder(ref: string, path: number[], draft: any, symbol: symbol, authority: string, parent: DocNode) : DocNode {
    const hasChildren = this.getPatternOfObject<HasChildren>(draft, 'getChildrenLinks');
    const hasDocNodeLenses = this.getPatternOfObject<HasDocNodeLenses>(draft, 'docNodeLenses');
    return {
      draft,
      childrenNodes: [],
      hasChildren,
      hasDocNodeLenses,
      path,
      ref,
      symbol,
      parent,
      authority,
      editable: true,
      focused: false
    }
  }

  /** node updated as reference */
  async spliceChildren(node: DocNode, elements: any[] = [], index?: number, count: number = 0): Promise<string[]> {
    this.logger.log('spliceChildren()', {node, elements, index, count});
    
    const currentChildren = node.hasChildren.getChildrenLinks(node.draft);
    index = index !== undefined ? index : currentChildren.length;

    /** create objects if elements is not an id */
    const getNewNodes = elements.map((el, ix) => {
      const elIndex = (index as number) + ix;
      if (typeof el !== 'string') {
        const tempRef = node.ref + '-' + elIndex.toString();
        return Promise.resolve(this.createPlaceholder(tempRef, node.path.concat(elIndex), el.object, el.symbol, node.authority, node));
      } else {
        return this.loadNodeRec(el, node.path.concat(elIndex), node);
      }
    })

    const newNodes = await Promise.all(getNewNodes);

    let newChildren = [...currentChildren];
    const removed = newChildren.splice(index, count, ...newNodes.map(node => node.ref));
    node.childrenNodes.splice(index, count, ...newNodes);

    /** update path of child nodes */
    node.childrenNodes.map((child, ix) => child.path = node.path.concat([ix]));
    node.draft = node.hasChildren.replaceChildrenLinks(node.draft)(newChildren);

    return removed;
  }

  /** explore node children at path until the last child of the last child is find 
   * and returns the path to that element */
  getLastChild(node: DocNode) {
    let child = node;
    while (child.childrenNodes.length > 0) {
      child = node.childrenNodes[child.childrenNodes.length - 1];
    }
    return child;
  }

  getNextSiblingOf(node: DocNode): DocNode | undefined {
    if (!node.parent) return undefined;
    const last = node.path[node.path.length - 1];
    if (last === (node.parent.childrenNodes.length - 1)) {
      /** this is the last child of its parent */
      return undefined;
    } else {
      /** return the next  */
      return node.parent.childrenNodes[last + 1];
    }
  }

  /** the tree of nodes is falttened, this gets the upper node in that flat list */
  getDownwardNode(node: DocNode) : DocNode | undefined {
    if (node.childrenNodes.length > 0) {
      /** downward is the first child */
      return node.childrenNodes[0];
    } else {
      let nextSibling = this.getNextSiblingOf(node);
      if (nextSibling) {
        return nextSibling;
      } else {
        if (!node.parent) return undefined;
        return this.getNextSiblingOf(node.parent);
      }
    }
  }

  getBackwardNode(node: DocNode) : DocNode | undefined {
    const last = node.path[node.path.length - 1];
    if (last === 0) {
      /** backward is the parent */
      return node.parent;
    } else {
      /** backward is the last child of the upper sybling */
      let pathOfBackward = [...node.path];
      const siblingPath = [...pathOfBackward];
      siblingPath[siblingPath.length - 1] = last - 1;
      return this.getLastChild(this.getNodeAt(siblingPath));
    }
  }

  async createChild(node: DocNode, newEntity: any, symbol: symbol, index?: number) {
    this.logger.log('createChild()', {node, newEntity, symbol, index});

    await this.spliceChildren(node, [{object: newEntity, symbol}], 0);

    /** focus child */
    const child = node.childrenNodes[0];

    if (child.parent) {
      child.parent.focused = false;
    } 
    child.focused = true;
    
    this.requestUpdate();
  }

  async createSibling(node: DocNode, newEntity: any, symbol: symbol) {
    if (!node.parent) throw new Error('Node dont have a parent');
    this.logger.log('createSibling()', {node, newEntity, symbol});

    const siblingIx = node.path[node.path.length - 1] + 1;
    await this.spliceChildren(node.parent, [{object: newEntity, symbol}], siblingIx);

    /** focus sibling */
    const sibling = node.parent.childrenNodes[siblingIx];
    node.focused = false;
    sibling.focused = true;
    
    this.requestUpdate();
  }

  scheduleUpdate() {
    throw new Error('TBD');
  }

  focused(node: DocNode) {
    this.logger.log('focused()', {node});
    node.focused = true;
    this.requestUpdate();
  }

  blured(node: DocNode) {
    this.logger.log('blured()', {node});
    node.focused = false;
    this.requestUpdate();
  }

  focusBackward(node: DocNode) {
    this.logger.log('focusBackward()', {node});
    
    const backwardNode = this.getBackwardNode(node);
    if (!backwardNode) return;

    node.focused = false;
    backwardNode.focused = true;
    this.requestUpdate();
  }

  focusDownward(node: DocNode) {
    this.logger.log('focusDownward()', {node});
    
    const downwardNode = this.getDownwardNode(node);
    if (!downwardNode) return;

    node.focused = false;
    downwardNode.focused = true;
    this.requestUpdate();
  }

  contentChanged(node: DocNode, content: any) {
    this.logger.log('contentChanged()', {node, content});
    
    /** optimistically set node.draft */
    node.draft = content;

    /** inform the external world if top element */
    if (node.path.length === 1) {
      this.dispatchEvent(new ContentUpdatedEvent({
        bubbles: true,
        composed: true,
        detail: { ref: this.ref as string }
      }));
    }
    this.requestUpdate();
  }

  joinBackward(node: DocNode, tail: string) {
    this.logger.log('contentChanged()', {node, tail});

    throw new Error('TBD');
  }

  lift(node: DocNode) {
    this.logger.log('contentChanged()', {node});

    throw new Error('TBD');
  }

  push(node: DocNode) {
    this.logger.log('push()', {node});

    throw new Error('TBD');
  }

  split(node: DocNode, tail: string, asChild: boolean) {
    this.logger.log('split()', { node, tail });
    
    const dftEntity = this.defaultEntity(tail, TextType.Paragraph);
    
    if (asChild) {
      this.createChild(node, dftEntity.data, dftEntity.symbol, 0);
    } else {
      this.createSibling(node, dftEntity.data, dftEntity.symbol);
    }
  }
  
  renderWithCortex(node: DocNode) {
    return html`<cortex-entity hash=${node.ref}></cortex-entity>`;
  }

  renderTopRow(node: DocNode) {
    /** the ref to which the parent is pointing at */
    const firstRef = node.parent ? node.parent.childrenNodes[node.path[node.path.length - 1]].ref : node.ref;
    const color = 'red';
    const nodeLense = node.hasDocNodeLenses.docNodeLenses()[0];
    const isPlaceholder = node.data === undefined;
    
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
            ${nodeLense.render(node, {
              focus: () => this.focused(node),
              blur: () => this.blured(node),
              contentChanged: (content: any) => this.contentChanged(node, content),
              focusBackward: () => this.focusBackward(node),
              focusDownward: () => this.focusDownward(node),
              joinBackward: (tail: string) => this.joinBackward(node, tail),
              lift: () => this.lift(node),
              push: () => this.push(node),
              split: (tail: string, asChild: boolean) => this.split(node, tail, asChild),
            })}
            ${false ? html`<div class="node-mark">${icons.add_box}</div>` : ''}
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
    return node.hasDocNodeLenses.docNodeLenses().length > 0 ? 
      this.renderHere(node) : 
      this.renderWithCortex(node);
  }

  render() {
    this.logger.log('render()', {doc: this.doc});
    if (!this.doc) return '';
    return this.renderDocNode(this.doc);
  }

  static get styles() {
    return css`
      .column {
        display: flex;
        flex-direction: row;
      }

      .node-content {
        flex: 1 1 0;
        position: relative;
      }

      .node-mark {
        position: absolute;
        left: -2px;
        top: 7px;
        fill: #3a865a;
      }

      .node-mark svg {
        height: 14px;
        width: 14px;
      }
    `;
  }
}
