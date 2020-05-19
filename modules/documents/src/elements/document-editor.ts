import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import isEqual from 'lodash-es/isEqual';

export const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, (matches) => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { HasChildren, CortexModule, PatternRecognizer, Entity } from '@uprtcl/cortex';
import {
  EveesRemote,
  EveesModule,
  UPDATE_HEAD,
  RemoteMap,
  ContentUpdatedEvent,
  CREATE_PERSPECTIVE,
  CREATE_ENTITY,
  EveesDraftsLocal,
  MenuConfig,
  EveesHelpers,
} from '@uprtcl/evees';
import { loadEntity, CASStore } from '@uprtcl/multiplatform';

import { TextType, DocNode } from '../types';
import { HasDocNodeLenses } from '../patterns/document-patterns';
import { icons } from './prosemirror/icons';
import { DocumentsBindings } from '../bindings';

const LOGINFO = false;
const SELECTED_BACKGROUND = 'rgb(200,200,200,0.2);';
const PLACEHOLDER_TOKEN = '_PLACEHOLDER_';

export class DocumentEditor extends moduleConnect(LitElement) {
  logger = new Logger('DOCUMENT-EDITOR');

  @property({ type: String })
  ref!: string;

  @property({ type: String })
  editable: string = 'true';

  @property({ attribute: false })
  client!: ApolloClient<any>;

  @property({ attribute: false })
  doc!: DocNode;

  @property({ attribute: false })
  docHasChanges: boolean = false;

  @property({ attribute: false })
  persistingAll: boolean = false;

  @property({ type: Boolean, attribute: false })
  showCommitMessage: boolean = false;

  @property({ type: String })
  color!: string;

  protected eveesRemotes!: EveesRemote[];
  protected remotesMap!: RemoteMap;
  protected recognizer!: PatternRecognizer;

  draftService = new EveesDraftsLocal();

  firstUpdated() {
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.remotesMap = this.request(EveesModule.bindings.RemoteMap);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    if (LOGINFO) this.logger.log('firstUpdated()', this.ref);

    this.loadDoc();
  }

  updated(changedProperties) {
    if (LOGINFO) this.logger.log('updated()', { ref: this.ref, changedProperties });

    if (changedProperties.has('ref')) {
      this.loadDoc();
    }
    if (changedProperties.has('client')) {
      this.loadDoc();
    }
  }

  async loadDoc() {
    if (!this.client) return;

    if (LOGINFO) this.logger.log('loadDoc()', this.ref);

    if (!this.ref) return;
    this.doc = await this.loadNodeRec(this.ref);
  }

  async loadNodeRec(ref: string, ix?: number, parent?: DocNode): Promise<DocNode> {
    if (LOGINFO) this.logger.log('loadNodeRec()', { ref, ix, parent });

    const node = await this.loadNode(ref, parent, ix);

    const loadChildren = node.hasChildren.getChildrenLinks({ id: '', object: node.draft }).map(
      async (child, ix): Promise<DocNode> => {
        return child !== undefined && child !== ''
          ? await this.loadNodeRec(child, ix, node)
          : node.childrenNodes[ix];
      }
    );

    node.parent = parent;
    node.childrenNodes = await Promise.all(loadChildren);

    /** focus if top element */
    if (node.ref === this.ref && node.editable) {
      node.focused = true;
    }

    return node;
  }

  async refToNode(ref: string, parent?: DocNode, ix?: number) {
    const entity = await loadEntity(this.client, ref);
    if (!entity) throw Error(`Entity not found ${ref}`);

    let entityType: string = this.recognizer.recognizeType(entity);

    let editable = false;
    let authority!: string | undefined;
    let context!: string;
    let dataId!: string;
    let headId!: string;

    if (entityType === EveesModule.bindings.PerspectiveType) {
      authority = await EveesHelpers.getPerspectiveAuthority(this.client, entity.id);

      if (this.editable === 'true') {
        const accessControl = await EveesHelpers.getAccessControl(this.client, entity.id);
        editable = accessControl ? accessControl.canWrite : false;
        context = await EveesHelpers.getPerspectiveContext(this.client, entity.id);
        headId = await EveesHelpers.getPerspectiveHeadId(this.client, entity.id);
        dataId = await EveesHelpers.getCommitDataId(this.client, headId);
      } else {
        editable = false;
        dataId = await EveesHelpers.getPerspectiveDataId(this.client, entity.id);
        context = '';
        headId = '';
      }
    } else {
      if (entityType === 'Commit') {
        if (!parent) throw new Error('Commit must have a parent');

        editable = parent.editable;
        authority = parent.authority;
        dataId = await EveesHelpers.getCommitDataId(this.client, entity.id);
        headId = this.ref;
      } else {
        entityType = 'Data';
        editable = false;
        authority = '';
        dataId = this.ref;
        headId = '';
      }
    }

    if (!dataId || !entityType) throw Error(`data not loaded for ref ${this.ref}`);

    // TODO get data and patterns hasChildren/hasDocNodeLenses from query
    const data: Entity<any> | undefined = await loadEntity(this.client, dataId);
    if (!data) throw Error('Data undefined');

    const hasChildren: HasChildren = this.recognizer
      .recognizeBehaviours(data)
      .find((b) => (b as HasChildren).getChildrenLinks);
    const hasDocNodeLenses: HasDocNodeLenses = this.recognizer
      .recognizeBehaviours(data)
      .find((b) => (b as HasDocNodeLenses).docNodeLenses);

    if (!hasChildren) throw Error('hasChildren undefined');
    if (!hasDocNodeLenses) throw Error('hasDocNodeLenses undefined');

    /** disable editable */
    if (this.editable !== 'true') {
      editable = false;
    }

    const node: DocNode = {
      ref: entity.id,
      ix,
      hasChildren,
      childrenNodes: [],
      data,
      draft: data ? data.object : undefined,
      headId,
      hasDocNodeLenses,
      editable,
      authority,
      context,
      focused: false,
    };

    return node;
  }

  isPlaceholder(ref: string): boolean {
    return ref.startsWith(PLACEHOLDER_TOKEN);
  }

  async loadNode(ref: string, parent?: DocNode, ix?: number): Promise<DocNode> {
    if (LOGINFO) this.logger.log('loadNode()', { ref, ix });

    let node;
    if (this.isPlaceholder(ref)) {
      const draft = await this.draftService.getDraft(ref);
      node = this.draftToPlaceholder(draft, parent, ix);
    } else {
      node = await this.refToNode(ref, parent, ix);

      /** initialize draft */
      const draft = await this.draftService.getDraft(ref);
      if (draft !== undefined) {
        node.draft = draft;
      }
    }

    if (LOGINFO) this.logger.log('loadNode() post', { ref, ix, node });

    return node;
  }

  defaultEntity(text: string, type: TextType) {
    return {
      data: { text, type, links: [] },
      entityType: DocumentsBindings.TextNodeType,
    };
  }

  getStore(eveesAuthority: string, type: string): CASStore {
    if (!this.remotesMap) throw new Error('remotes config undefined');
    const remote = this.eveesRemotes.find((r) => r.authority === eveesAuthority);

    if (!remote) throw new Error(`Could not find evees remote with authority ID ${eveesAuthority}`);

    return this.remotesMap(remote, type);
  }

  hasChangesAll() {
    if (!this.doc) return true;
    return this.hasChangesRec(this.doc);
  }

  hasChanges(node: DocNode) {
    if (node.ref === '') return true; // is placeholder
    if (!node.data) return true;
    if (!isEqual(node.data.object, node.draft)) return true;
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
    // console.log({ hasChanges: this.docHasChanges });
    let event = new CustomEvent('doc-changed', {
      detail: {
        docChanged: this.docHasChanges,
      },
    });
    this.dispatchEvent(event);
    super.performUpdate();
  }

  async persistAll(message?: string) {
    if (!this.doc) return;
    this.persistingAll = true;
    if (this.doc.authority === undefined) throw Error('top element must have an authority');
    await this.persistNodeRec(this.doc, this.doc.authority, message);
    /** reload doc from backend */
    await this.loadDoc();
    this.requestUpdate();
    this.persistingAll = false;
  }

  async persistNodeRec(node: DocNode, defaultAuthority: string, message?: string) {
    const persistChildren = node.childrenNodes.map((child) =>
      this.persistNodeRec(child, defaultAuthority, message)
    );
    await Promise.all(persistChildren);

    /** set the children with the children refs (which were created above) */
    const { object } = node.hasChildren.replaceChildrenLinks({ id: '', object: node.draft })(
      node.childrenNodes.map((node) => node.ref)
    );
    this.setNodeDraft(node, object);

    await this.persistNode(node, defaultAuthority, message);
  }

  async persistNode(node: DocNode, defaultAuthority: string, message?: string) {
    if (
      !this.isPlaceholder(node.ref) &&
      node.data !== undefined &&
      isEqual(node.data.object, node.draft)
    ) {
      /** nothing to persist here */
      return;
    }

    let refType;

    /** keep entity type or create commit by default */
    if (!this.isPlaceholder(node.ref)) {
      const entity = await loadEntity(this.client, node.ref);
      if (!entity) throw new Error('entity not found');
      refType = this.recognizer.recognizeType(entity);
    } else {
      refType = EveesModule.bindings.CommitType;
    }

    /** if its a placeholder create an object, otherwise make a commit */
    switch (refType) {
      case EveesModule.bindings.PerspectiveType:
        await this.updateEvee(node, message);
        break;

      case EveesModule.bindings.CommitType:
        const commitParents = this.isPlaceholder(node.ref) ? [] : node.headId ? [node.headId] : [];
        const commitId = await this.createCommit(
          node.draft,
          node.authority !== undefined ? node.authority : defaultAuthority,
          commitParents,
          message
        );
        node.ref = commitId;
        break;

      default:
        if (node.authority === undefined) throw Error(`authority not defined for node ${node.ref}`);
        const dataId = await this.createEntity(node.draft, node.authority);
        node.ref = dataId;
        break;
    }

    /** clean draft memory */
    await this.draftService.removeDraft(node.ref);
  }

  async createEntity(content: any, authority: string): Promise<string> {
    const entityType = this.recognizer.recognizeType({ id: '', object: content });
    const store = this.getStore(authority, entityType);

    const createTextNode = await this.client.mutate({
      mutation: CREATE_ENTITY,
      variables: {
        object: content,
        casID: store.casID,
      },
    });

    return createTextNode.data.createEntity.id;
  }

  async createCommit(
    content: object,
    authority: string,
    parentsIds?: string[],
    message?: string
  ): Promise<string> {
    const dataId = await this.createEntity(content, authority);

    const remote = this.eveesRemotes.find((r) => r.authority === authority);
    if (!remote) throw new Error(`Remote not found for authority ${authority}`);

    return await EveesHelpers.createCommit(this.client, remote, { dataId, parentsIds });
  }

  async updateEvee(node: DocNode, message?: string): Promise<void> {
    if (node.authority === undefined) throw Error(`authority not defined for node ${node.ref}`);

    const commitId = await this.createCommit(
      node.draft,
      node.authority,
      node.headId ? [node.headId] : []
    );

    await this.client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: node.ref,
        context: node.context,
        headId: commitId,
        message,
      },
    });

    /** inform the external world if top element */
    if (this.doc && node.ref === this.doc.ref) {
      this.dispatchEvent(
        new ContentUpdatedEvent({
          bubbles: true,
          composed: true,
          detail: { ref: this.ref as string },
        })
      );
    }
  }

  async createEvee(
    content: object,
    authority: string,
    casID: string,
    context: string
  ): Promise<string> {
    if (LOGINFO) this.logger.log('createEvee()', { content, authority });

    const commitId = await this.createCommit(content, authority);

    if (!this.eveesRemotes) throw new Error('eveesRemotes undefined');
    const remote = this.eveesRemotes.find((r) => r.authority === authority);
    if (!remote) throw new Error(`Remote not found for authority ${authority}`);

    const createPerspective = await this.client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        headId: commitId,
        context,
        parentId: this.ref,
        casID: remote.casID,
      },
    });

    return createPerspective.data.createPerspective.id;
  }

  draftToPlaceholder(draft: any, parent?: DocNode, ix?: number) {
    const draftForReco = { id: '', object: draft };
    const hasChildren = this.recognizer
      .recognizeBehaviours(draftForReco)
      .find((b) => (b as HasChildren).getChildrenLinks);

    const hasDocNodeLenses = this.recognizer
      .recognizeBehaviours(draftForReco)
      .find((b) => (b as HasDocNodeLenses).docNodeLenses);

    const context = `${parent ? parent.context : 'ROOT'}-${ix}-${Date.now()}`;

    if (!hasChildren)
      throw new Error(`hasChildren not found for object ${JSON.stringify(draftForReco)}`);
    if (!hasDocNodeLenses)
      throw new Error(`hasDocNodeLenses not found for object ${JSON.stringify(draftForReco)}`);

    const randint = 0 + Math.floor((10000 - 0) * Math.random());
    const ref = PLACEHOLDER_TOKEN + `-${ix !== undefined ? ix : 0}-${randint}`;

    return {
      ref,
      ix,
      parent,
      draft,
      childrenNodes: [],
      hasChildren,
      hasDocNodeLenses,
      context,
      editable: true,
      focused: false,
    };
  }

  createPlaceholder(draft: any, parent?: DocNode, ix?: number): DocNode {
    const node = this.draftToPlaceholder(draft, parent, ix);
    /** async store */
    this.draftService.setDraft(node.ref, node.draft);
    return node;
  }

  setNodeDraft(node, draft) {
    node.draft = draft;
    /** async store */
    this.draftService.setDraft(node.ref, draft);
  }

  /** node updated as reference */
  async spliceChildren(
    node: DocNode,
    elements: any[] = [],
    index?: number,
    count: number = 0
  ): Promise<DocNode[]> {
    if (LOGINFO) this.logger.log('spliceChildren()', { node, elements, index, count });

    const currentChildren = node.hasChildren.getChildrenLinks({ id: '', object: node.draft });
    index = index !== undefined ? index : currentChildren.length;

    /** create objects if elements is not an id */
    const getNewNodes = elements.map((el, ix) => {
      const elIndex = (index as number) + ix;
      if (typeof el !== 'string') {
        if (el.object !== undefined && el.entityType !== undefined) {
          /** element is an object from which a DocNode should be create */
          const placeholder = this.createPlaceholder(el.object, node, elIndex);
          return Promise.resolve(placeholder);
        } else {
          /** element is a DocNode */
          return Promise.resolve(el);
        }
      } else {
        /** element is a string (a ref) */
        return this.loadNodeRec(el, elIndex, node);
      }
    });

    const newNodes = await Promise.all(getNewNodes);

    let newChildren = [...currentChildren];
    newChildren.splice(index, count, ...newNodes.map((node) => node.ref));
    const removed = node.childrenNodes.splice(index, count, ...newNodes);

    /** update ix and parent of child nodes */
    node.childrenNodes.map((child, ix) => {
      child.ix = ix;
      child.parent = node;
    });

    const { object } = node.hasChildren.replaceChildrenLinks({ id: '', object: node.draft })(
      newChildren
    );
    this.setNodeDraft(node, object);

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

    if (node.ix === node.parent.childrenNodes.length - 1) {
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
  getDownwardNode(node: DocNode): DocNode | undefined {
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

  getBackwardNode(node: DocNode): DocNode | undefined {
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

  async createChild(node: DocNode, newEntity: any, entityType: string, index?: number) {
    if (LOGINFO) this.logger.log('createChild()', { node, newEntity, entityType, index });

    await this.spliceChildren(node, [{ object: newEntity, entityType }], 0);

    /** focus child */
    const child = node.childrenNodes[0];

    if (child.parent) {
      child.parent.focused = false;
    }
    child.focused = true;

    this.requestUpdate();
  }

  async createSibling(node: DocNode, newEntity: any, entityType: string) {
    if (!node.parent) throw new Error('Node dont have a parent');
    if (node.ix === undefined) throw new Error('Node dont have an ix');

    if (LOGINFO) this.logger.log('createSibling()', { node, newEntity, entityType });

    await this.spliceChildren(node.parent, [{ object: newEntity, entityType }], node.ix + 1);

    /** focus sibling */
    const sibling = node.parent.childrenNodes[node.ix + 1];
    node.focused = false;
    sibling.focused = true;

    this.requestUpdate();
  }

  focused(node: DocNode) {
    if (LOGINFO) this.logger.log('focused()', { node });
    node.focused = true;
    this.requestUpdate();
  }

  blured(node: DocNode) {
    if (LOGINFO) this.logger.log('blured()', { node });
    node.focused = false;
    this.requestUpdate();
  }

  focusBackward(node: DocNode) {
    if (LOGINFO) this.logger.log('focusBackward()', { node });

    const backwardNode = this.getBackwardNode(node);
    if (!backwardNode) return;

    node.focused = false;
    backwardNode.focused = true;
    this.requestUpdate();
  }

  focusDownward(node: DocNode) {
    if (LOGINFO) this.logger.log('focusDownward()', { node });

    const downwardNode = this.getDownwardNode(node);
    if (!downwardNode) return;

    node.focused = false;
    downwardNode.focused = true;
    this.requestUpdate();
  }

  async contentChanged(node: DocNode, content: any, lift?: boolean) {
    if (LOGINFO) this.logger.log('contentChanged()', { node, content });

    const oldType = node.draft.type;

    this.setNodeDraft(node, content);

    /** react to type change by manipulating the tree */
    /** PAR => TITLE */
    if (oldType === TextType.Paragraph && content.type === TextType.Title) {
      if (lift === undefined || lift === false) {
        await this.nestAfter(node);
      } else {
        if (!node.parent) throw new Error('parent undefined');
        await this.nestAfter(node);
        await this.liftChildren(node.parent, node.ix, 1);
      }
    }

    /** TITLE => PAR */
    if (oldType === TextType.Title && content.type === TextType.Paragraph) {
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
    const deltaWithChidren = node.parent.childrenNodes
      .slice(ixNext)
      .findIndex((sibling) => sibling.childrenNodes.length > 0);

    /** remove next siblings (until the first sibling with childs is found) from parent */
    const removed = await this.spliceChildren(
      node.parent,
      [],
      ixNext,
      deltaWithChidren !== -1 ? deltaWithChidren : node.parent.childrenNodes.length - ixNext
    );

    /** add them as child of this node */
    await this.spliceChildren(node, removed);
  }

  async liftChildren(node: DocNode, index?: number, count?: number) {
    if (!node.parent) throw new Error('parent undefined');
    if (node.ix === undefined) throw new Error('ix undefined');

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
        await this.spliceChildren(backwardNode.parent, elements, backwardNode.ix + 1);
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
    if (LOGINFO) this.logger.log('joinBackward()', { node, tail });

    /** remove this node children */
    const removed = await this.spliceChildren(node, [], 0, node.childrenNodes.length);
    await this.appendBackwards(node, tail, removed);

    this.requestUpdate();
  }

  async pullDownward(node: DocNode) {
    if (LOGINFO) this.logger.log('pullDownward()', { node });

    const next = this.getDownwardNode(node);
    if (!next) return;

    await this.joinBackward(next, next.draft.text);
    this.requestUpdate();
  }

  async lift(node: DocNode) {
    if (!node.parent) throw new Error('parent undefined');
    if (node.ix === undefined) throw new Error('ix undefined');

    await this.liftChildren(node.parent, node.ix, 1);

    this.requestUpdate();
  }

  async split(node: DocNode, tail: string, asChild: boolean) {
    if (LOGINFO) this.logger.log('split()', { node, tail });

    const dftEntity = this.defaultEntity(tail, TextType.Paragraph);

    if (asChild) {
      await this.createChild(node, dftEntity.data, dftEntity.entityType, 0);
    } else {
      await this.createSibling(node, dftEntity.data, dftEntity.entityType);
    }

    this.requestUpdate();
  }

  isNodeFocused() {
    return this.isNodeFocusedRec(this.doc);
  }

  isNodeFocusedRec(node: DocNode): boolean {
    if (node.focused) {
      return true;
    } else {
      for (let ix = 0; ix < node.childrenNodes.length; ix++) {
        if (this.isNodeFocusedRec(node.childrenNodes[ix])) {
          return true;
        }
      }
    }
    return false;
  }

  getLastNode(): DocNode {
    return this.getLastNodeRec(this.doc);
  }

  getLastNodeRec(node: DocNode): DocNode {
    if (node.childrenNodes.length === 0) {
      return node;
    } else {
      return this.getLastNodeRec(node.childrenNodes[node.childrenNodes.length - 1]);
    }
  }

  clickAreaClicked() {
    if (!this.isNodeFocused()) {
      const last = this.getLastNode();
      last.focused = true;
    }
    this.requestUpdate();
  }

  connectedCallback() {
    super.connectedCallback();

    // this.addEventListener('keydown', event => {
    //   if (event.keyCode === 83) {
    //     if (event.ctrlKey === true) {
    //       event.preventDefault();
    //       this.persistAll();
    //     }
    //   }
    // });
  }

  commitWithMessageClicked() {
    this.showCommitMessage = true;
  }

  cancelCommitClicked() {
    this.showCommitMessage = false;
  }

  acceptCommitClicked() {
    if (!this.shadowRoot) return;
    const input = this.shadowRoot.getElementById('COMMIT_MESSAGE') as any;
    const message = input.value;

    this.showCommitMessage = false;

    this.persistAll(message);
  }

  renderWithCortex(node: DocNode) {
    return html` <cortex-entity hash=${node.ref}></cortex-entity> `;
  }

  renderTopRow(node: DocNode) {
    if (LOGINFO) this.logger.log('renderTopRow()', { node });
    /** the ref to which the parent is pointing at */
    const color = this.color;
    const nodeLense = node.hasDocNodeLenses.docNodeLenses()[0];
    const hasIcon = this.hasChanges(node);
    const icon = node.ref === '' ? icons.add_box : icons.edit;

    return html`
      <div class="row">
        <div class="column">
          <div class="evee-info">
            ${false
              ? html`
                  <evees-info-popper
                    first-perspective-id=${node.ref}
                    perspective-id=${node.ref}
                    evee-color=${color}
                  ></evees-info-popper>
                `
              : ''}
          </div>
          <div class="node-content">
            ${nodeLense.render(node, {
              focus: () => this.focused(node),
              blur: () => this.blured(node),
              contentChanged: (content: any, lift: boolean) =>
                this.contentChanged(node, content, lift),
              focusBackward: () => this.focusBackward(node),
              focusDownward: () => this.focusDownward(node),
              joinBackward: (tail: string) => this.joinBackward(node, tail),
              pullDownward: () => this.pullDownward(node),
              lift: () => this.lift(node),
              split: (tail: string, asChild: boolean) => this.split(node, tail, asChild),
              appended: () => this.appended(node),
            })}
            ${hasIcon ? html` <div class="node-mark">${icon}</div> ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderHere(node: DocNode) {
    return html`
      ${this.renderTopRow(node)}
      ${node.childrenNodes
        ? node.childrenNodes.map((child) => {
            return this.renderDocNode(child);
          })
        : ''}
    `;
  }

  renderDocNode(node: DocNode) {
    return html`
      <div
        style=${styleMap({ backgroundColor: node.focused ? SELECTED_BACKGROUND : 'transparent' })}
      >
        ${node.hasDocNodeLenses.docNodeLenses().length > 0
          ? this.renderHere(node)
          : this.renderWithCortex(node)}
      </div>
    `;
  }

  commitOptionSelected(e) {
    switch (e.detail.key) {
      case 'push':
        this.persistAll();
        break;

      case 'push-with-message':
        this.commitWithMessageClicked();
        break;
    }
  }

  renderTopBar() {
    const options: MenuConfig = {
      // 'push': {
      //   graphic: 'unarchive',
      //   text: 'push'
      // },
      'push-with-message': {
        graphic: 'notes',
        text: 'push with message',
      },
    };
    return html`
      <div class="doc-topbar">
        ${this.docHasChanges && !this.showCommitMessage
          ? html`
              <div class="button-container">
                <evees-loading-button
                  icon="unarchive"
                  @click=${() => this.persistAll()}
                  loading=${this.persistingAll ? 'true' : 'false'}
                  label="push"
                >
                </evees-loading-button>
              </div>
              <!-- <evees-options-menu 
                .config=${options} 
                @option-click=${this.commitOptionSelected}
                icon="arrow_drop_down">
              </evees-options-menu> -->
              <evees-help>
                <span>
                  Your current changes are safely stored on this device and won't be lost.<br /><br />
                  "Push" them if<br /><br />
                  <li>You are about to propose a merge.</li>
                  <br />
                  <li>This draft is public and you want them to be visible to others.</li>
                </span>
              </evees-help>
            `
          : ''}
        ${this.showCommitMessage
          ? html`
              <mwc-textfield outlined id="COMMIT_MESSAGE" label="Message"> </mwc-textfield>
              <mwc-icon-button icon="clear" @click=${this.cancelCommitClicked}> </mwc-icon-button>
              <mwc-icon-button icon="done" @click=${this.acceptCommitClicked}> </mwc-icon-button>
            `
          : ''}
      </div>
    `;
  }

  render() {
    if (LOGINFO) this.logger.log('render()', { doc: this.doc });

    if (!this.doc) {
      return html` <cortex-loading-placeholder></cortex-loading-placeholder> `;
    }

    return html`
      <div class="editor-container">
        ${this.renderTopBar()} ${this.renderDocNode(this.doc)}
      </div>
      <div @click=${this.clickAreaClicked} class="click-area"></div>
    `;
  }

  static get styles() {
    return css`
      :host {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      .editor-container {
        position: relative;
        width: 100%;
      }
      .button-container {
        height: 48px;
        margin-right: 6px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .click-area {
        flex-grow: 1;
      }

      .doc-topbar {
        position: absolute;
        top: -55px;
        right: 10px;
        display: flex;
      }

      .row {
        margin-bottom: 8px;
      }

      .column {
        display: flex;
        flex-direction: row;
      }

      .evee-info {
        width: 30px;
        min-width: 30px;
      }

      .node-content {
        max-width: calc(100% - 30px);
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
        fill: rgb(80, 80, 80, 0.2);
      }

      .node-mark svg {
        height: 14px;
        width: 14px;
      }

      @media (max-width: 768px) {
        .doc-topbar {
          display: none;
        }
      }
    `;
  }
}
