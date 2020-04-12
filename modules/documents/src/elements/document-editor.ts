import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import * as lodash from 'lodash-es';


export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Pattern, HasChildren, CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesRemote, EveesModule, RemotesConfig,UPDATE_HEAD, ContentUpdatedEvent, CREATE_COMMIT, CREATE_PERSPECTIVE, CREATE_ENTITY } from '@uprtcl/evees';
import { Source, DiscoveryModule, DiscoveryService } from '@uprtcl/multiplatform';

import { TextType, DocNode, TextNode, EntityType } from 'src/types';
import { HasDocNodeLenses } from 'src/patterns/document-patterns';
import { DocumentsBindings } from 'src/bindings';
import { icons } from './prosemirror/icons';

const LOGINFO = false;

export class DocumentEditor extends moduleConnect(LitElement) {

  logger = new Logger('DOCUMENT-EDITOR');

  @property({ type: String })
  ref: string | undefined = undefined;

  @property({ type: Object, attribute: false })
  doc: DocNode | undefined = undefined;

  @property({ type: Boolean, attribute: false })
  docHasChanges: Boolean = false;

  @property({ type: String })
  color!: string;

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

    if (LOGINFO) this.logger.log('firstUpdated()', this.ref)

    this.loadDoc();
  }

  updated(changedProperties) {
    if (LOGINFO) this.logger.log('updated()', {ref: this.ref, changedProperties})
    
    if (changedProperties.has('ref')) {
      this.loadDoc();
    }
  }

  async loadDoc() {
    if (LOGINFO) this.logger.log('loadDoc()', this.ref);

    if (!this.ref) return;
    this.doc = await this.loadNodeRec(this.ref);
  }

  async loadNodeRec(ref: string, ix?: number, parent?: DocNode) : Promise<DocNode>  {
    if (LOGINFO) this.logger.log('loadNodeRec()', {ref, ix, parent});

    const node = await this.loadNode(ref, parent, ix);
    
    const loadChildren = node.hasChildren.getChildrenLinks(node.draft).map(async (child, ix): Promise<DocNode> => {
      return (child !== undefined && child !== '') ? 
        await this.loadNodeRec(child, ix, node)  :
        node.childrenNodes[ix]
    })

    node.parent = parent;
    node.childrenNodes = await Promise.all(loadChildren);

    /** focus if top element */
    if (this.doc && node.ref === this.doc.ref && node.editable) {
      node.focused = true;
    }

    return node;
  }

  async loadNode(ref: string, parent?: DocNode, ix?: number) : Promise<DocNode> {
    if (LOGINFO) this.logger.log('loadNode()', {ref, ix});
    
    const client = this.client as ApolloClient<any>;
    const discovery = this.discovery as DiscoveryService;
    const recognizer = this.recognizer as PatternRecognizer;
    
    const entity = await discovery.get(ref) as object;
    const pattern = recognizer.recognize(entity);
    
    let entityType: EntityType | undefined;
    let editable = false;
    let authority: string | undefined = undefined;
    let context: string | undefined = undefined;
    let dataId: string | undefined = undefined;
    let headId: string | undefined = undefined;

    if (pattern.findIndex(p => p.name === "Perspective") !== -1) {
      entityType = EntityType.Perspective;
      const result = await client.query({
        query: gql`
        {
          entity(id: "${ref}") {
            id
            ... on Perspective {
              payload {
                authority
              }
              head {
                id 
                ... on Commit {
                  data {
                    id
                  }
                }
              }
              context {
                id
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
      editable = result.data.entity._context.patterns.accessControl.canWrite;
      authority = result.data.entity.payload.authority;
      context = result.data.entity.context.id;
      dataId = result.data.entity.head.data.id;
      headId = result.data.entity.head.id;
    }

    if (pattern.findIndex(p => p.name === "Commit") !== -1) {
      if (!parent) throw new Error('Commit must have a parent');

      entityType = EntityType.Commit;
      const result = await client.query({
        query: gql`
        {
          entity(id: "${ref}") {
            id
            ... on Commit {
              data {
                id
              }
            }
          }
        }`
      });

      editable = parent.editable;
      authority = parent.authority;
      dataId = result.data.entity.data.id;
      headId = this.ref;
    }

    if (!dataId || !entityType || !authority) throw Error(`data not loaded for ref ${this.ref}`);

    // TODO get data and patterns hasChildren/hasDocNodeLenses from query
    const data = await discovery.get(dataId);
    if (!data) throw Error('Data undefined');

    const hasChildren = this.getPatternOfObject<HasChildren>(data.object, 'getChildrenLinks');
    if (!data) throw Error('hasChildren undefined');

    const hasDocNodeLenses = this.getPatternOfObject<HasDocNodeLenses>(data.object, 'docNodeLenses');
    if (!hasDocNodeLenses) throw Error('docNodeLenses undefined');

    const node: DocNode = {
      ref, 
      ix, 
      hasChildren,
      childrenNodes: [],
      data, 
      draft: {...data.object},
      entityType,
      headId,
      hasDocNodeLenses,
      editable,
      authority,
      context,
      focused: false
    }
    
    if (LOGINFO) this.logger.log('loadNode() post', {ref, ix, node});

    return node;
  }

  defaultEntity(text: string, type: TextType) {
    return { 
      data: { text, type, links: [] },
      symbol: DocumentsBindings.TextNodeEntity
    }
  }

  getPatternOfObject<T>(object: object, patternName: string): T {
    const recognizer = this.recognizer as PatternRecognizer
    const pattern: T | undefined = recognizer
      .recognize(object)
      .find(prop => !!(prop as T)[patternName]);

    if (!pattern) throw new Error(`No "${patternName}" pattern registered for object ${JSON.stringify(object)}`);
    return pattern;
  }

  getPatternOfSymbol<T>(symbol: string, name: string) {
    if (LOGINFO) this.logger.log(`getPatternOfSymbol(${symbol.toString()})`);

    const patterns: Pattern[] = this.requestAll(symbol);
    const create: T | undefined = (patterns.find(
      pattern => ((pattern as unknown) as T)[name]
    ) as unknown) as T;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
  }

  getStore(eveesAuthority: string): Source {
    if (!this.remotesConfig) throw new Error('remotes config undefined');
    return this.remotesConfig.map(eveesAuthority);
  }

  hasChangesAll() {
    if (!this.doc) return true;
    return this.hasChangesRec(this.doc);
  }

  hasChanges(node: DocNode) {
    if (node.ref === '') return true; // is placeholder
    if (!node.data) return true;
    if (!lodash.isEqual(node.data.object, node.draft)) return true;
    return false;
  }

  hasChangesRec(node: DocNode) {
    if (this.hasChanges(node)) return true;
    const ix = node.childrenNodes.find((child) => this.hasChangesRec(child));
    if (ix !== undefined) return true;
    return false;    
  }

  performUpdate() {
    this.docHasChanges = this.hasChangesAll();
    super.performUpdate();
  }

  async persistAll() {
    if (!this.doc) return;
    await this.persistNodeRec(this.doc);
    /** reload doc from backend */
    await this.loadDoc();
    this.requestUpdate();
  }

  async persistNodeRec(node: DocNode) {
    const persistChildren = node.childrenNodes.map(child => this.persistNodeRec(child));
    await Promise.all(persistChildren);

    /** set the children with the children refs (which were created above) */
    node.draft = node.hasChildren.replaceChildrenLinks(node.draft)(node.childrenNodes.map(node => node.ref));
    
    await this.persistNode(node);
  }

  async persistNode(node: DocNode) {
    const isPlaceholder = node.ref === undefined || node.ref === '';
    
    if (!isPlaceholder && (node.data !== undefined) && lodash.isEqual(node.data.object, node.draft)) {
      /** nothing to persist here */
      return 
    }

    /** if its a placeholder create an object, otherwise make a commit */
    switch (node.entityType) { 
      case EntityType.Perspective:
        if (isPlaceholder) {
          node.ref = await this.createEvee(node.draft, node.authority, node.context as string);
        } else {
          await this.updateEvee(node);
        }
        break;
      
      case EntityType.Commit: 
        const commitId = await this.createCommit(node.draft, node.authority, node.parent ? [node.parent.ref] : []);
        node.ref = commitId;
        break;

      case EntityType.Data:
        const store = this.getStore(node.authority);
        const dataId = await this.createEntity(node.draft, store.source);
        node.ref = dataId;
        break;
    }   
  }

  async createEntity(content: any, source: string): Promise<string> {
    const client = this.client as ApolloClient<any>;

    // TODO, replace for a single CREATE mutation
      const createTextNode = await client.mutate({
      mutation: CREATE_ENTITY,
      variables: {
        content: JSON.stringify(content),
        source: source
      }
    });
    // }

    return createTextNode.data.createEntity;
  }

  async createCommit(content: object, authority: string, parentsIds?: string[]) : Promise<string> {
    const eveesRemotes = this.eveesRemotes as EveesRemote[];
    const client = this.client as ApolloClient<any>;

    const store = this.getStore(authority);
    const objectId = await this.createEntity(content, store.source);
   
    const remote = eveesRemotes.find(r => r.authority === authority);
    if (!remote) throw new Error(`Remote not found for authority ${authority}`);

    const createCommit = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: objectId,
        parentsIds,
        source: remote.source
      }
    });

    if (LOGINFO) this.logger.info('createCommit()', {content});

    return createCommit.data.createCommit.id;
  }

  async updateEvee(node: DocNode): Promise<void> {
    const eveesRemotes = this.eveesRemotes as EveesRemote[];
    const client = this.client as ApolloClient<any>;

    const commitId = await this.createCommit(node.draft, node.authority, node.headId ? [node.headId] : []);

    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: node.ref,
        context: node.context,
        headId: commitId
      }
    });

    /** inform the external world if top element */
    if (this.doc && node.ref === this.doc.ref) {
      this.dispatchEvent(new ContentUpdatedEvent({
        bubbles: true,
        composed: true,
        detail: { ref: this.ref as string }
      }));
    }
  }

  async createEvee(content: object, authority: string, context: string): Promise<string> {
    const client = this.client as ApolloClient<any>;
    
    if (LOGINFO) this.logger.log('createEvee()', {content, authority});

    const commitId = await this.createCommit(content, authority);

    if (!this.eveesRemotes) throw new Error('eveesRemotes undefined');
    const remote = this.eveesRemotes.find(r => r.authority === authority);
    if (!remote) throw new Error(`Remote not found for authority ${authority}`);

    const createPerspective = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        headId: commitId,
        context,
        parentId: this.ref,
        source: remote.source
      }
    });

    return createPerspective.data.createPerspective.id;
  }

  createPlaceholder(ref: string, ix: number, draft: any, authority: string, parent: DocNode, entityType: EntityType) : DocNode {
    const hasChildren = this.getPatternOfObject<HasChildren>(draft, 'getChildrenLinks');
    const hasDocNodeLenses = this.getPatternOfObject<HasDocNodeLenses>(draft, 'docNodeLenses');
    const context = `${parent.context}-${ix}-${Date.now()}`;

    return {
      draft,
      childrenNodes: [],
      hasChildren,
      hasDocNodeLenses,
      entityType,
      ix,
      ref,
      parent,
      authority,
      context,
      editable: true,
      focused: false
    }
  }

  /** node updated as reference */
  async spliceChildren(node: DocNode, elements: any[] = [], index?: number, count: number = 0): Promise<DocNode[]> {
    if (LOGINFO) this.logger.log('spliceChildren()', {node, elements, index, count});
    
    const currentChildren = node.hasChildren.getChildrenLinks(node.draft);
    index = index !== undefined ? index : currentChildren.length;

    /** create objects if elements is not an id */
    const getNewNodes = elements.map((el, ix) => {
      const elIndex = (index as number) + ix;
      if (typeof el !== 'string') {
        if ((el.object !== undefined) && (el.symbol !== undefined)) {
          /** element is an object from which a DocNode should be create */
          return Promise.resolve(this.createPlaceholder('', elIndex, el.object, node.authority, node, EntityType.Commit));
        } else {
          /** element is a DocNode */
          return Promise.resolve(el);
        }
      } else {
        /** element is a string (a ref) */
        return this.loadNodeRec(el, elIndex, node);
      }
    })

    const newNodes = await Promise.all(getNewNodes);

    let newChildren = [...currentChildren];
    newChildren.splice(index, count, ...newNodes.map(node => node.ref));
    const removed = node.childrenNodes.splice(index, count, ...newNodes);

    /** update ix and parent of child nodes */
    node.childrenNodes.map((child, ix) => { 
      child.ix = ix; 
      child.parent = node; 
    });

    node.draft = node.hasChildren.replaceChildrenLinks(node.draft)(newChildren);

    return removed;
  }

  /** explore node children at path until the last child of the last child is find 
   * and returns the path to that element */
  getLastChild(node: DocNode) {
    let child = node;
    while (child.childrenNodes.length > 0) {
      child = child.childrenNodes[child.childrenNodes.length - 1];
    }
    return child;
  }

  getNextSiblingOf(node: DocNode): DocNode | undefined {
    if (!node.parent) return undefined;
    if (node.ix === undefined) return undefined;

    if (node.ix === (node.parent.childrenNodes.length - 1)) {
      /** this is the last child of its parent */
      return undefined;
    } else {
      /** return the next  */
      return node.parent.childrenNodes[node.ix + 1];
    }
  }

  /** find the next sibling of the parent with a next sibling */
  getNextSiblingOfLastParent(node: DocNode): DocNode | undefined {
    let parent = node.parent;

    let nextSibling = parent ? this.getNextSiblingOf(parent) : undefined;

    while (parent && !nextSibling) {
      parent = parent.parent;
      nextSibling = parent ? this.getNextSiblingOf(parent) : undefined;
    }

    return nextSibling;
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
        return this.getNextSiblingOfLastParent(node);
      }
    }
  }

  getBackwardNode(node: DocNode) : DocNode | undefined {
    if (node.ix === undefined) throw new Error('Node dont have an ix');

    if (node.ix === 0) {
      /** backward is the parent */
      return node.parent;
    } else {
      /** backward is the last child of the upper sybling */
      if (!node.parent) return undefined;
      return this.getLastChild(node.parent.childrenNodes[node.ix - 1]);
    }
  }

  async createChild(node: DocNode, newEntity: any, symbol: string, index?: number) {
    if (LOGINFO) this.logger.log('createChild()', {node, newEntity, symbol, index});

    await this.spliceChildren(node, [{object: newEntity, symbol}], 0);

    /** focus child */
    const child = node.childrenNodes[0];

    if (child.parent) {
      child.parent.focused = false;
    } 
    child.focused = true;
    
    this.requestUpdate();
  }

  async createSibling(node: DocNode, newEntity: any, symbol: string) {
    if (!node.parent) throw new Error('Node dont have a parent');
    if (node.ix === undefined) throw new Error('Node dont have an ix');

    if (LOGINFO) this.logger.log('createSibling()', {node, newEntity, symbol});

    await this.spliceChildren(node.parent, [{object: newEntity, symbol}], node.ix + 1);

    /** focus sibling */
    const sibling = node.parent.childrenNodes[node.ix + 1];
    node.focused = false;
    sibling.focused = true;
    
    this.requestUpdate();
  }

  focused(node: DocNode) {
    if (LOGINFO) this.logger.log('focused()', {node});
    node.focused = true;
    this.requestUpdate();
  }

  blured(node: DocNode) {
    if (LOGINFO) this.logger.log('blured()', {node});
    node.focused = false;
    this.requestUpdate();
  }

  focusBackward(node: DocNode) {
    if (LOGINFO) this.logger.log('focusBackward()', {node});
    
    const backwardNode = this.getBackwardNode(node);
    if (!backwardNode) return;

    node.focused = false;
    backwardNode.focused = true;
    this.requestUpdate();
  }

  focusDownward(node: DocNode) {
    if (LOGINFO) this.logger.log('focusDownward()', {node});
    
    const downwardNode = this.getDownwardNode(node);
    if (!downwardNode) return;

    node.focused = false;
    downwardNode.focused = true;
    this.requestUpdate();
  }

  async contentChanged(node: DocNode, content: any, lift?: boolean) {
    if (LOGINFO) this.logger.log('contentChanged()', {node, content});

    const oldType = node.draft.type;
    node.draft = content;

    /** react to type change by manipulating the tree */
    /** PAR => TITLE */
    if ((oldType === TextType.Paragraph) && (content.type === TextType.Title)) {
      if (lift === undefined || lift === false) {
        await this.nestAfter(node);
      } else {
        if (!node.parent) throw new Error('parent undefined');
        await this.nestAfter(node);
        await this.liftChildren(node.parent, node.ix, 1);
      }
    }

    /** TITLE => PAR */
    if ((oldType === TextType.Title) && (content.type === TextType.Paragraph)) {
      /** remove this node children */
      const children = await this.spliceChildren(node, [], 0, node.childrenNodes.length);
      /** append backwards this node with its children as siblings */
      await this.appendBackwards(node, '', [node].concat(children));
    }
    
    this.requestUpdate();
  }

  /** take all next syblings of node and nest them under it */
  async nestAfter(node: DocNode) {
    if (!node.parent) return;
    if (node.ix === undefined) return;
    
    const ix = node.ix;
    const ixNext = ix + 1;
    const deltaWithChidren = node.parent.childrenNodes.slice(ixNext).findIndex(sibling => sibling.childrenNodes.length > 0);
    
    /** remove next siblings (until the first sibling with childs is found) from parent */
    const removed = await this.spliceChildren(
      node.parent, 
      [], 
      ixNext, 
      deltaWithChidren !== -1 ? deltaWithChidren : (node.parent.childrenNodes.length - ixNext));

    /** add them as child of this node */
    await this.spliceChildren(node, removed);    
  }

  async liftChildren(node: DocNode, index?: number, count?: number) {
    if(!node.parent) throw new Error('parent undefined');
    if(node.ix === undefined) throw new Error('ix undefined');

    /** default to all children */
    index = index !== undefined ? index : 0;
    count = count !== undefined ? count : node.childrenNodes.length;

    /** remove children */
    const removed = await this.spliceChildren(node, [], index, count);

    /** add to parent */
    await this.spliceChildren(node.parent, removed, node.ix + 1);
  }

  /** content is appended to the node, elements are added as silblings */
  async appendBackwards(node: DocNode, content: any, elements: DocNode[]) {
    const backwardNode = this.getBackwardNode(node);
    if (!backwardNode) throw new Error('backward node not found');

    if (node.parent === undefined) throw new Error('cant remove node');
    if (node.ix === undefined) throw new Error('cant remove node');

    /** set the content to append to the backward node */
    backwardNode.append = content;
    /** remove this node */
    await this.spliceChildren(node.parent, [], node.ix, 1);

    if (elements.length > 0) {
      if (backwardNode.parent !== undefined) {
        if (backwardNode.ix === undefined) throw new Error('cant append elements');
          /** add elements as siblings of backward node */
        await this.spliceChildren(backwardNode.parent, elements, backwardNode.ix + 1)
      } else {
          /** add elements as children of backward node */
        await this.spliceChildren(backwardNode, elements, 0);
      }
    }
    
    backwardNode.focused = true;
    node.focused = false;
  }

  appended(node: DocNode) {
    node.append = undefined;
    this.requestUpdate();
  }

  async joinBackward(node: DocNode, tail: string) {
    if (LOGINFO) this.logger.log('joinBackward()', {node, tail});

    /** remove this node children */
    const removed = await this.spliceChildren(node, [], 0, node.childrenNodes.length);
    await this.appendBackwards(node, tail, removed);

    this.requestUpdate();
  }

  async pullDownward(node: DocNode) {
    if (LOGINFO) this.logger.log('pullDownward()', {node});

    const next = this.getDownwardNode(node);
    if (!next) return;

    await this.joinBackward(next, next.draft.text);
    this.requestUpdate();
  }

  async lift(node: DocNode) {
    if(!node.parent) throw new Error('parent undefined');
    if(node.ix === undefined) throw new Error('ix undefined');
    
    await this.liftChildren(node.parent, node.ix, 1);

    this.requestUpdate();
  }
  
  async split(node: DocNode, tail: string, asChild: boolean) {
    if (LOGINFO) this.logger.log('split()', { node, tail });
    
    const dftEntity = this.defaultEntity(tail, TextType.Paragraph);
    
    if (asChild) {
      await this.createChild(node, dftEntity.data, dftEntity.symbol, 0);
    } else {
      await this.createSibling(node, dftEntity.data, dftEntity.symbol);
    }

    this.requestUpdate();
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keydown', (event) => {
      if (event.keyCode === 83) {
        if (event.ctrlKey === true) {
          event.preventDefault();
          this.persistAll();
        }
      }
    })

  }
  
  renderWithCortex(node: DocNode) {
    return html`<cortex-entity hash=${node.ref}></cortex-entity>`;
  }

  renderTopRow(node: DocNode) {
    if (LOGINFO) this.logger.log('renderTopRow()', {node});
    /** the ref to which the parent is pointing at */
    const color = this.color;
    const nodeLense = node.hasDocNodeLenses.docNodeLenses()[0];
    const hasIcon = this.hasChanges(node);
    const icon = node.ref === '' ? icons.add_box : icons.edit;

    return html`
      <div class="row">
        <div class="column">
          <div class="evee-info">
            ${((node.ref !== '') && (node.entityType === EntityType.Perspective)) ? html`
              <evees-info-popper 
                first-perspective-id=${node.ref}
                perspective-id=${node.ref}
                evee-color=${color}
              ></evees-info-popper>` : ''}
          </div>
          <div class="node-content">
            ${nodeLense.render(node, {
              focus: () => this.focused(node),
              blur: () => this.blured(node),
              contentChanged: (content: any, lift: boolean) => this.contentChanged(node, content, lift),
              focusBackward: () => this.focusBackward(node),
              focusDownward: () => this.focusDownward(node),
              joinBackward: (tail: string) => this.joinBackward(node, tail),
              pullDownward: () => this.pullDownward(node),
              lift: () => this.lift(node),
              split: (tail: string, asChild: boolean) => this.split(node, tail, asChild),
              appended: () => this.appended(node)
            })}
            ${hasIcon ? html`<div class="node-mark">${icon}</div>` : ''}
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
    return html`
      <div style=${styleMap({ backgroundColor: node.focused ? '#f7f6f3' : 'transparent' })}>
        ${node.hasDocNodeLenses.docNodeLenses().length > 0 ? 
          this.renderHere(node) : 
          this.renderWithCortex(node)}
      </div>`;
  }

  render() {
    if (LOGINFO) this.logger.log('render()', {doc: this.doc});
    
    if (!this.doc) {
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;
    }

    return html`
      <div class="editor-container">
        <div class="doc-topbar">
          ${this.docHasChanges ? html`
            <mwc-button 
              outlined
              icon="save_alt" 
              @click=${() => this.persistAll()}>
              commit
            </mwc-button>` : ''}
        </div>
        ${this.renderDocNode(this.doc)}
      </div>
    `;
  }

  static get styles() {
    return css`
      .editor-container {
        position: relative;
        width: 100%;
      }

      .doc-topbar {
        position: absolute;
        top:-55px;
        right: 35px;
      }

      .column {
        display: flex;
        flex-direction: row;
      }

      .evee-info {
        width: 30px;
      }

      .node-content {
        flex: 1 1 0;
        position: relative;
      }

      .node-mark {
        position: absolute;
        top: 0px;
        left: -6px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        fill: #cfc994;
      }

      .node-mark svg {
        height: 14px;
        width: 14px;
      }
    `;
  }
}
