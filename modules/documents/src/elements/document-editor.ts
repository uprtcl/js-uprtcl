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
  }

  async loadDoc() {
    this.logger.log('loadDoc()', this.ref);

    if (!this.ref) return;
    this.doc = await this.loadNodeRec(this.ref, [0]);
  }

  async loadNodeRec(ref: string, path: number[], parent?: DocNode) : Promise<DocNode>  {
    this.logger.log('loadNodeRec()', {ref, path, parent});

    const node = await this.loadNode(ref, path);
    
    const loadChildren = node.hasChildren.getChildrenLinks(node.data).map(async (child, ix): Promise<DocNode> => {
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

    const hasChildren = this.getPatternOfObject<HasChildren>(data, 'getChildrenLinks');
    if (!data) throw Error('hasChildren undefined');

    const hasDocNodeLenses = this.getPatternOfObject<HasDocNodeLenses>(data, 'docNodeLenses');
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

  async commitContentOf(node: DocNode): Promise<void> {
    const eveesRemotes = this.eveesRemotes as EveesRemote[];
    const client = this.client as ApolloClient<any>;
    
    const object = await this.createEntity(node.data.object, node.symbol, node.authority);
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

  /** node updated as reference */
  async spliceChildren(path: number[], elements: any[] = [], index?: number, count: number = 0): Promise<string[]> {
    this.logger.log('spliceChildren()', {path, elements, index, count});
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

  /** explore node children at path until the last child of the last child is find 
   * and returns the path to that element */
  getLastChildRelPath(path: number[]) {
    let relPath: number[] = [];
    let node = this.getNodeAt(path);
    
    while (node.childrenNodes.length > 0) {
      const lastChildIx = node.childrenNodes.length - 1;
      relPath.push(lastChildIx);
      node = node.childrenNodes[lastChildIx];
    }

    return path.concat(relPath);
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
  getDownwardNodeAt(path: number[]) : DocNode | undefined {
    const node = this.getNodeAt(path);

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

  getBackwardNodeAt(path: number[]) {
    const last = path[path.length];
    if (last === 0) {
      /** backward is the parent, thus remove the last element in the path */
      return this.getNodeAt(path).parent;
    } else {
      let pathOfBackward = [...path];
      /** backward is the last child of the upper sybling */
      const siblingPath = [...pathOfBackward];
      siblingPath[siblingPath.length - 1] = last - 1;
      pathOfBackward = this.getLastChildRelPath(siblingPath);
      return this.getNodeAt(pathOfBackward);
    }
  }

  async createChildAt(path: number[], newEntity: any, symbol: symbol, index?: number) {
    this.logger.log('createChildAt()', {path, newEntity, symbol, index});

    const node = this.getNodeAt(path);
    const newLink = await this.createEvee(newEntity, symbol, node.authority);
    await this.spliceChildren(path, [newLink], 0);
  }

  scheduleUpdate() {
    throw new Error('TBD');
  }

  focused(path: number[]) {
    this.logger.log('focused()', {path});

    const node = this.getNodeAt(path);
    node.focused = true;
    this.requestUpdate();
  }

  blured(path: number[]) {
    this.logger.log('blured()', {path});

    const node = this.getNodeAt(path);
    node.focused = false;
    this.requestUpdate();
  }

  focusBackward(path: number[]) {
    this.logger.log('focusBackward()', {path});

    const node = this.getNodeAt(path);
    const backwardNode = this.getBackwardNodeAt(path);
    if (!backwardNode) return;

    node.focused = false;
    backwardNode.focused = true;
    this.requestUpdate();
  }

  focusDownward(path: number[]) {
    this.logger.log('focusDownward()', {path});

    const node = this.getNodeAt(path);
    const downwardNode = this.getDownwardNodeAt(path);
    if (!downwardNode) return;

    node.focused = false;
    downwardNode.focused = true;
    this.requestUpdate();
  }

  contentChanged(path: number[], content: any) {
    this.logger.log('contentChanged()', {path, content});

    const node = this.getNodeAt(path);
    
    /** optimistically set node.data */
    node.data = content;
    /** trigger update node content */
    this.commitContentOf(node);

    /** inform the external world if top element */
    if (path.length === 1) {
      this.dispatchEvent(new ContentUpdatedEvent({
        bubbles: true,
        composed: true,
        detail: { ref: this.ref as string }
      }));
    }
    this.requestUpdate();
  }

  joinBackward(path: number[], tail: string) {
    this.logger.log('contentChanged()', {path, tail});

    throw new Error('TBD');
  }

  lift(path: number[]) {
    this.logger.log('contentChanged()', {path});

    throw new Error('TBD');
  }

  push(path: number[]) {
    this.logger.log('push()', {path});

    throw new Error('TBD');
  }

  split(path: number[], tail: string) {
    this.logger.log('split()', {path, tail});

    throw new Error('TBD');
  }
  
  renderWithCortex(node: DocNode) {
    return html`<cortex-entity hash=${node.ref}></cortex-entity>`;
  }

  renderTopRow(node: DocNode) {

    /** the ref to which the parent is pointing at */
    const firstRef = node.parent ? node.parent.childrenNodes[node.path[node.path.length - 1]].ref : node.ref;
    const color = 'red';
    const nodeLense = node.hasDocNodeLenses.docNodeLenses()[0];
    
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
              focus: () => this.focused(node.path),
              blur: () => this.blured(node.path),
              contentChanged: (content: any) => this.contentChanged(node.path, content),
              focusBackward: () => this.focusBackward(node.path),
              focusDownward: () => this.focusDownward(node.path),
              joinBackward: (tail: string) => this.joinBackward(node.path, tail),
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
    return node.hasDocNodeLenses.docNodeLenses().length > 0 ? 
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

      .node-content {
        flex: 1 1 0;
      }
    `;
  }
}
