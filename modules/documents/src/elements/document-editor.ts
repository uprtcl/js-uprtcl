import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';
import isEqual from 'lodash-es/isEqual';

import { ApolloClientModule } from '@uprtcl/graphql';

const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { HasChildren, CortexModule, PatternRecognizer, Entity } from '@uprtcl/cortex';
import {
  EveesRemote,
  EveesModule,
  UPDATE_HEAD,
  eveeColor,
  ContentUpdatedEvent,
  CREATE_ENTITY,
  EveesDraftsLocal,
  EveesHelpers,
  deriveSecured,
  Perspective,
  Secured,
  hashObject,
  EveesConfig
} from '@uprtcl/evees';
import { MenuConfig } from '@uprtcl/common-ui';
import { loadEntity } from '@uprtcl/multiplatform';

import { TextType, DocNode } from '../types';
import { HasDocNodeLenses } from '../patterns/document-patterns';
import { icons } from './prosemirror/icons';
import { DocumentsBindings } from '../bindings';

const LOGINFO = false;
const SELECTED_BACKGROUND = 'rgb(200,200,200,0.2);';
const PLACEHOLDER_TOKEN = '_PLACEHOLDER_';

export class DocumentEditor extends moduleConnect(LitElement) {
  logger = new Logger('DOCUMENT-EDITOR');

  @property({ type: String, attribute: 'uref' })
  firstRef!: string;

  @property({ attribute: false })
  uref!: string;

  @property({ type: String, attribute: 'official-owner' })
  officialOwner!: string;

  @property({ type: Boolean, attribute: 'check-owner' })
  checkOwner: boolean = false;

  @property({ type: Boolean, attribute: 'read-only' })
  readOnly: boolean = false;

  @property({ type: Number, attribute: 'root-level' })
  rootLevel: number = 0;

  @property({ type: String })
  parentId: string = '';

  @property({ type: String, attribute: 'default-type' })
  defaultType: string = EveesModule.bindings.PerspectiveType;

  @property({ type: Boolean, attribute: 'show-info' })
  renderInfo: boolean = false;

  @property({ attribute: false })
  docHasChanges: boolean = false;

  @property({ attribute: false })
  persistingAll: boolean = false;

  @property({ type: Boolean, attribute: false })
  showCommitMessage: boolean = false;

  @property({ type: String })
  color!: string;

  @property({ attribute: false })
  reloading: boolean = true;

  @property({ attribute: false })
  checkedOutPerspectives: { [key: string]: { firstUref: string; newUref: string } } = {};

  doc: DocNode | undefined = undefined;
  client!: ApolloClient<any>;

  protected remotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;
  protected editableRemotesIds!: string[];

  draftService = new EveesDraftsLocal();

  async firstUpdated() {
    this.remotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    const config = this.request(EveesModule.bindings.Config) as EveesConfig;
    this.editableRemotesIds = config.editableRemotesIds ? config.editableRemotesIds : [];

    if (!this.client) {
      this.client = this.request(ApolloClientModule.bindings.Client);
    }

    this.uref = this.firstRef;

    if (LOGINFO) this.logger.log('firstUpdated()', this.uref);

    await this.loadDoc();
    this.reloading = false;
  }

  updated(changedProperties) {
    if (LOGINFO)
      this.logger.log('updated()', { uref: this.uref, firstRef: this.firstRef, changedProperties });

    let reload: boolean = false;

    if (changedProperties.has('firstRef')) {
      this.uref = this.firstRef;
    }
    if (changedProperties.has('uref')) {
      reload = true;
    }
    if (changedProperties.has('client')) {
      reload = true;
    }
    if (changedProperties.has('editable')) {
      reload = true;
    }
    if (reload) {
      this.reload();
    }
  }

  async reload() {
    this.reloading = true;
    await this.loadDoc();
    this.reloading = false;
  }

  async loadDoc() {
    if (!this.client) return;

    if (LOGINFO) this.logger.log('loadDoc()', this.uref);

    if (!this.uref) return;
    this.doc = await this.loadNodeRec(this.uref);
    this.requestUpdate();
  }

  async loadNodeRec(uref: string, ix?: number, parent?: DocNode): Promise<DocNode> {
    if (LOGINFO) this.logger.log('loadNodeRec()', { uref, ix, parent });

    const node = await this.loadNode(uref, parent, ix);

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
    if (node.uref === this.uref && node.editable) {
      node.focused = true;
    }

    return node;
  }

  async refToNode(uref: string, parent?: DocNode, ix?: number) {
    const entity = await loadEntity(this.client, uref);
    if (!entity) throw Error(`Entity not found ${uref}`);

    let entityType: string = this.recognizer.recognizeType(entity);

    let editable = false;
    let remoteId: string | undefined;
    let context: string | undefined;
    let dataId: string | undefined;
    let headId: string | undefined;

    if (entityType === EveesModule.bindings.PerspectiveType) {
      remoteId = await EveesHelpers.getPerspectiveRemoteId(this.client, entity.id);

      const remote = this.remotes.find(r => r.id === remoteId);
      if (!remote) throw new Error(`remote not found for ${remoteId}`);

      let canWrite: boolean = false;

      if (!this.readOnly) {
        const editableRemote =
          this.editableRemotesIds.length > 0 ? this.editableRemotesIds.includes(remote.id) : true;
        if (editableRemote) {
          canWrite = await EveesHelpers.canWrite(this.client, uref);
        }
      }

      if (!this.readOnly) {
        editable = canWrite;
        headId = await EveesHelpers.getPerspectiveHeadId(this.client, entity.id);
        dataId =
          headId !== undefined
            ? await EveesHelpers.getCommitDataId(this.client, headId)
            : undefined;
      } else {
        editable = false;
        dataId = await EveesHelpers.getPerspectiveDataId(this.client, entity.id);
        context = '';
        headId = '';
      }
    } else {
      if (entityType === EveesModule.bindings.CommitType) {
        if (!parent) throw new Error('Commit must have a parent');

        editable = parent.editable;
        remoteId = parent.remote;
        dataId = await EveesHelpers.getCommitDataId(this.client, entity.id);
        headId = uref;
      } else {
        entityType = 'Data';
        editable = false;
        remoteId = '';
        dataId = uref;
        headId = '';
      }
    }

    if (!dataId || !entityType) throw Error(`data not loaded for uref ${this.uref}`);

    // TODO get data and patterns hasChildren/hasDocNodeLenses from query
    const data: Entity<any> | undefined = await loadEntity(this.client, dataId);
    if (!data) throw Error('Data undefined');

    const hasChildren: HasChildren = this.recognizer
      .recognizeBehaviours(data)
      .find(b => (b as HasChildren).getChildrenLinks);
    const hasDocNodeLenses: HasDocNodeLenses = this.recognizer
      .recognizeBehaviours(data)
      .find(b => (b as HasDocNodeLenses).docNodeLenses);

    if (!hasChildren) throw Error('hasChildren undefined');
    if (!hasDocNodeLenses) throw Error('hasDocNodeLenses undefined');

    /** disable editable */
    if (this.readOnly) {
      editable = false;
    }

    // Add node coordinates
    const coord = this.setNodeCoordinates(parent, ix);

    // Add node level
    const level = this.setNodeLevel(coord);

    const node: DocNode = {
      uref: entity.id,
      isPlaceholder: false,
      type: entityType,
      ix,
      hasChildren,
      childrenNodes: [],
      data,
      draft: data ? data.object : undefined,
      coord,
      level,
      headId,
      hasDocNodeLenses,
      editable,
      remote: remoteId,
      context,
      focused: false,
      timestamp: Date.now()
    };

    return node;
  }

  setNodeCoordinates(parent?: DocNode, ix?: number) {
    const currentIndex = ix ? ix : 0;
    const coord = parent && parent.coord ? parent.coord.concat([currentIndex]) : [currentIndex];

    return coord;
  }

  setNodeLevel(coord) {
    return this.rootLevel + (coord.length - 1);
  }

  isPlaceholder(uref: string): boolean {
    return uref.startsWith(PLACEHOLDER_TOKEN);
  }

  async loadNode(uref: string, parent?: DocNode, ix?: number): Promise<DocNode> {
    if (LOGINFO) this.logger.log('loadNode()', { uref, ix });

    let node;
    if (this.isPlaceholder(uref)) {
      const draft = await this.draftService.getDraft(uref);
      node = this.draftToPlaceholder(draft, parent, ix);
    } else {
      node = await this.refToNode(uref, parent, ix);

      /** initialize draft */
      const draft = await this.draftService.getDraft(uref);
      if (draft !== undefined) {
        node.draft = draft;
      }
    }

    if (LOGINFO) this.logger.log('loadNode() post', { uref, ix, node });

    return node;
  }

  defaultEntity(text: string, type: TextType) {
    return {
      data: { text, type, links: [] },
      entityType: DocumentsBindings.TextNodeType
    };
  }

  hasChangesAll() {
    if (!this.doc) return false;
    return this.hasChangesRec(this.doc);
  }

  hasChanges(node: DocNode) {
    if (node.uref === '') return true; // is placeholder
    if (!node.data) return true;
    if (!isEqual(node.data.object, node.draft)) return true;
    return false;
  }

  hasChangesRec(node: DocNode) {
    if (this.hasChanges(node)) return true;
    const ix = node.childrenNodes.find(child => this.hasChangesRec(child));
    if (ix !== undefined) return true;
    return false;
  }

  performUpdate() {
    this.docHasChanges = this.hasChangesAll();
    // console.log({ hasChanges: this.docHasChanges });
    let event = new CustomEvent('doc-changed', {
      detail: {
        docChanged: this.docHasChanges
      }
    });
    this.dispatchEvent(event);
    super.performUpdate();
  }

  async persistAll(message?: string) {
    if (!this.doc) return;
    this.persistingAll = true;

    if (this.doc.remote === undefined) throw Error('top element must have an remote');

    await this.preparePersistRec(this.doc, this.doc.remote, message);
    await this.persistRec(this.doc);

    /** reload doc from backend */
    await this.loadDoc();
    this.requestUpdate();

    this.persistingAll = false;
  }

  async preparePersistRec(node: DocNode, defaultAuthority: string, message?: string) {
    const prepareChildren = node.childrenNodes.map(child =>
      this.preparePersistRec(child, defaultAuthority, message)
    );
    await Promise.all(prepareChildren);

    /** set the children with the children refs (which were created above) */
    const { object } = node.hasChildren.replaceChildrenLinks({
      id: '',
      object: node.draft
    })(node.childrenNodes.map(node => node.uref));
    this.setNodeDraft(node, object);

    await this.preparePersist(node, defaultAuthority, message);
  }

  async derivePerspective(node: DocNode): Promise<Secured<Perspective>> {
    const remoteInstance = this.remotes.find(r => r.id == node.remote);

    if (!remoteInstance) throw new Error(`Remote not found for remote ${remoteInstance}`);

    const creatorId = remoteInstance.userId ? remoteInstance.userId : '';

    const context = await hashObject({
      creatorId,
      timestamp: node.timestamp
    });

    const perspective: Perspective = {
      creatorId,
      remote: remoteInstance.id,
      path: remoteInstance.defaultPath,
      timestamp: node.timestamp,
      context
    };

    return deriveSecured<Perspective>(perspective, remoteInstance.store.cidConfig);
  }

  /* bottom up traverse the tree to set the uref of all placeholders */
  async preparePersist(node: DocNode, defaultRemote: string, message?: string) {
    if (!node.isPlaceholder) {
      return;
    }

    switch (this.defaultType) {
      case EveesModule.bindings.PerspectiveType:
        node.remote = node.remote !== undefined ? node.remote : defaultRemote;
        const secured = await this.derivePerspective(node);
        node.uref = secured.id;
        node.type = EveesModule.bindings.PerspectiveType;
        break;

      case EveesModule.bindings.CommitType:
        throw new Error('TBD');
      // const secured = await this.deriveCommit(node);
      // node.uref = commitId;
      // node.type = EveesModule.bindings.CommitType;
      // break;

      default:
        throw new Error('TBD');
      // const dataId = await this.createEntity(node.draft, node.remote);
      // node.uref = dataId;
      // break;
    }
  }

  /* top down persist all new nodes in their backend */
  async persistRec(node: DocNode) {
    await this.persist(node);

    const persistChildren = node.childrenNodes.map(child => this.persistRec(child));
    await Promise.all(persistChildren);
  }

  async persist(node: DocNode, message: string = '') {
    if (!node.isPlaceholder && node.data !== undefined && isEqual(node.data.object, node.draft)) {
      /** nothing to persist here */
      return;
    }

    switch (node.type) {
      case EveesModule.bindings.PerspectiveType:
        if (node.isPlaceholder) {
          const perspectiveId = await this.createEvee(node);
          if (perspectiveId !== node.uref) {
            throw new Error(
              `perspective id ${perspectiveId} of doc node not as expected ${node.uref}`
            );
          }
        } else {
          await this.updateEvee(node, message);
        }
        break;

      case EveesModule.bindings.CommitType:
        const commitParents = this.isPlaceholder(node.uref) ? [] : node.headId ? [node.headId] : [];

        if (node.remote === undefined) throw new Error('undefined remote for node');

        const commitId = await this.createCommit(node.draft, node.remote, commitParents, message);

        if (commitId !== node.uref) {
          throw new Error(`commit id ${commitId} of doc node not as expected ${node.uref}`);
        }
        break;
    }

    await this.draftService.removeDraft(node.placeholderRef ? node.placeholderRef : node.uref);
  }

  async createEntity(content: any, remote: string): Promise<string> {
    const entityType = this.recognizer.recognizeType({
      id: '',
      object: content
    });

    const remoteInstance = this.remotes.find(r => r.id === remote);
    if (!remoteInstance) throw new Error(`Remote not found for remote ${remote}`);
    const store = remoteInstance.store;

    const createTextNode = await this.client.mutate({
      mutation: CREATE_ENTITY,
      variables: {
        object: content,
        casID: store.casID
      }
    });

    return createTextNode.data.createEntity.id;
  }

  async createCommit(
    content: object,
    remote: string,
    parentsIds?: string[],
    message?: string
  ): Promise<string> {
    const dataId = await this.createEntity(content, remote);

    const remoteInstance = this.remotes.find(r => r.id === remote);
    if (!remoteInstance) throw new Error(`Remote not found for remote ${remote}`);

    return await EveesHelpers.createCommit(this.client, remoteInstance.store, {
      dataId,
      parentsIds
    });
  }

  async updateEvee(node: DocNode, message?: string): Promise<void> {
    if (node.remote === undefined) throw Error(`remote not defined for node ${node.uref}`);

    const commitId = await this.createCommit(
      node.draft,
      node.remote,
      node.headId ? [node.headId] : []
    );

    await this.client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: node.uref,
        headId: commitId,
        message
      }
    });

    /** inform the external world if top element */
    if (this.doc && node.uref === this.doc.uref) {
      this.dispatchEvent(
        new ContentUpdatedEvent({
          bubbles: true,
          composed: true,
          detail: { uref: this.uref as string }
        })
      );
    }
  }

  async createEvee(node: DocNode): Promise<string> {
    if (node.remote === undefined) throw new Error('undefined remote for node');

    if (LOGINFO) this.logger.log('createEvee()', { node });

    const commitId = await this.createCommit(node.draft, node.remote);

    const remoteInstance = this.remotes.find(r => r.id === node.remote);
    if (!remoteInstance) throw new Error(`Remote not found for remote ${node.remote}`);

    // using the same function used in preparePersist to get the same id
    const secured = await this.derivePerspective(node);

    return EveesHelpers.createPerspective(this.client, remoteInstance, {
      ...secured.object.payload,
      headId: commitId,
      parentId: node.parent ? node.parent.uref : undefined
    });
  }

  draftToPlaceholder(draft: any, parent?: DocNode, ix?: number): DocNode {
    const draftForReco = { id: '', object: draft };
    const hasChildren = this.recognizer
      .recognizeBehaviours(draftForReco)
      .find(b => (b as HasChildren).getChildrenLinks);

    const hasDocNodeLenses = this.recognizer
      .recognizeBehaviours(draftForReco)
      .find(b => (b as HasDocNodeLenses).docNodeLenses);

    if (!hasChildren)
      throw new Error(`hasChildren not found for object ${JSON.stringify(draftForReco)}`);
    if (!hasDocNodeLenses)
      throw new Error(`hasDocNodeLenses not found for object ${JSON.stringify(draftForReco)}`);

    const randint = 0 + Math.floor((10000 - 0) * Math.random());
    const uref = PLACEHOLDER_TOKEN + `-${ix !== undefined ? ix : 0}-${randint}`;

    // Add node coordinates
    const coord = this.setNodeCoordinates(parent, ix);

    // Add node level
    const level = this.setNodeLevel(coord);

    return {
      uref,
      placeholderRef: uref,
      isPlaceholder: true,
      ix,
      parent,
      draft,
      coord,
      level,
      childrenNodes: [],
      hasChildren,
      hasDocNodeLenses,
      editable: true,
      focused: false,
      timestamp: Date.now()
    };
  }

  createPlaceholder(draft: any, parent?: DocNode, ix?: number): DocNode {
    const node = this.draftToPlaceholder(draft, parent, ix);
    /** async store */
    this.draftService.setDraft(node.uref, node.draft);
    return node;
  }

  setNodeDraft(node, draft) {
    node.draft = draft;
    /** async store */
    this.draftService.setDraft(node.uref, draft);
  }

  /** node updated as reference */
  async spliceChildren(
    node: DocNode,
    elements: any[] = [],
    index?: number,
    count: number = 0
  ): Promise<DocNode[]> {
    if (LOGINFO) this.logger.log('spliceChildren()', { node, elements, index, count });

    const currentChildren = node.hasChildren.getChildrenLinks({
      id: '',
      object: node.draft
    });
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
        /** element is a string (a uref) */
        return this.loadNodeRec(el, elIndex, node);
      }
    });

    const newNodes = await Promise.all(getNewNodes);

    let newChildren = [...currentChildren];
    newChildren.splice(index, count, ...newNodes.map(node => node.uref));
    const removed = node.childrenNodes.splice(index, count, ...newNodes);

    /** update ix and parent of child nodes */
    node.childrenNodes.map((child, ix) => {
      child.ix = ix;
      child.parent = node;
      child.coord = node.coord.concat(ix);
      child.level = node.level + 1;
    });

    const { object } = node.hasChildren.replaceChildrenLinks({
      id: '',
      object: node.draft
    })(newChildren);
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
      .findIndex(sibling => sibling.childrenNodes.length > 0);

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
    if (!this.doc) return false;
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

  getLastNode(): DocNode | undefined {
    if (!this.doc) return undefined;
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
      if (last !== undefined) {
        last.focused = true;
      }
    }
    this.requestUpdate();
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      event.stopPropagation();
      this.uref = event.detail.perspectiveId;
    }) as EventListener);

    this.addEventListener('keydown', ((event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        event.stopPropagation();
        this.persistAll();
      }
    }) as EventListener);
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

  handleNodePerspectiveCheckout(e: CustomEvent, node: DocNode) {
    if (node.coord.length === 1 && node.coord[0] === 0) {
      /** if this is the top element, let the parent handle this */
      return;
    }

    e.stopPropagation();

    this.checkedOutPerspectives[JSON.stringify(node.coord)] = {
      firstUref: node.uref,
      newUref: e.detail.perspectiveId
    };

    this.requestUpdate();
  }

  handleEditorPerspectiveCheckout(e: CustomEvent, node: DocNode) {
    // we are in the parent document editor

    e.stopPropagation();

    const nodeCoord = JSON.stringify(node.coord);

    if (this.checkedOutPerspectives[nodeCoord] !== undefined) {
      if (this.checkedOutPerspectives[nodeCoord].firstUref === e.detail.perspectiveId) {
        delete this.checkedOutPerspectives[nodeCoord];
      } else {
        this.checkedOutPerspectives[nodeCoord].newUref = e.detail.perspectiveId;
      }
    }

    this.requestUpdate();
  }

  dragOverEffect(e, node: DocNode) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async handleDrop(e, node: DocNode) {
    e.preventDefault();
    e.stopPropagation();

    const dragged = JSON.parse(e.dataTransfer.getData('text/plain'));

    if (!dragged.uref) return;
    if (dragged.parentId === this.uref) return;
    if (node.parent === undefined) return;

    const ix = node.ix !== undefined ? node.ix : node.parent.childrenNodes.length - 1;
    await this.spliceChildren(node.parent, [dragged.uref], ix + 1, 0);

    this.requestUpdate();
  }

  getColor() {
    return this.color ? this.color : eveeColor(this.uref);
  }

  renderWithCortex(node: DocNode) {
    return html`
      <cortex-entity hash=${node.uref}></cortex-entity>
    `;
  }

  renderTopRow(node: DocNode) {
    if (LOGINFO) this.logger.log('renderTopRow()', { node });
    /** the uref to which the parent is pointing at */

    const nodeLense = node.hasDocNodeLenses.docNodeLenses()[0];
    const hasIcon = this.hasChanges(node);
    const icon = node.uref === '' ? icons.add_box : icons.edit;

    // for the topNode (the docId), the uref can change, for the other nodes it can't (if it does, a new editor is rendered)
    const uref = node.coord.length === 1 && node.coord[0] === 0 ? this.uref : node.uref;
    const firstRef = node.coord.length === 1 && node.coord[0] === 0 ? this.firstRef : node.uref;

    let paddingTop = '0px';
    if (node.draft.type === TextType.Title) {
      switch (node.level) {
        case 0:
          paddingTop = '20px';
          break;
        case 1:
          paddingTop = '14px';
          break;
        case 2:
          paddingTop = '10px';
          break;
        default:
          paddingTop = '0px';
          break;
      }
    }

    return html`
      <div
        class="row"
        @dragover=${e => this.dragOverEffect(e, node)}
        @drop=${e => this.handleDrop(e, node)}
      >
        <div class="evee-info" style=${`padding-top:${paddingTop}`}>
          ${!node.isPlaceholder && this.renderInfo
            ? html`
                <evees-info-popper
                  parent-id=${node.parent ? node.parent.uref : this.parentId}
                  uref=${uref}
                  first-uref=${firstRef}
                  official-owner=${this.officialOwner}
                  ?check-owner=${this.checkOwner}
                  evee-color=${this.getColor()}
                  @checkout-perspective=${e => this.handleNodePerspectiveCheckout(e, node)}
                  show-draft
                  show-info
                  show-icon
                  ?show-debug=${false}
                  emit-proposals
                ></evees-info-popper>
              `
            : html`
                <div class="empty-evees-info"></div>
              `}
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
            appended: () => this.appended(node)
          })}
          ${hasIcon
            ? html`
                <div class="node-mark">${icon}</div>
              `
            : ''}
        </div>
      </div>
    `;
  }

  renderHere(node: DocNode) {
    return html`
      ${this.renderTopRow(node)}
      ${node.childrenNodes
        ? node.childrenNodes.map(child => {
            return this.renderDocNode(child);
          })
        : ''}
    `;
  }

  renderDocNode(node: DocNode) {
    const coordString = JSON.stringify(node.coord);

    if (this.checkedOutPerspectives[coordString] !== undefined) {
      return html`
        <documents-editor
          uref=${this.checkedOutPerspectives[coordString].newUref}
          ?read-only=${this.readOnly}
          root-level=${node.level}
          color=${this.getColor()}
          @checkout-perspective=${e => this.handleEditorPerspectiveCheckout(e, node)}
          official-owner=${this.officialOwner}
          ?check-owner=${this.checkOwner}
          show-draft
          show-info
          show-icon
          ?show-debug=${false}
        >
        </documents-editor>
      `;
    }

    return html`
      <div
        style=${styleMap({
          backgroundColor: node.focused ? SELECTED_BACKGROUND : 'transparent'
        })}
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
      'push-with-message': {
        icon: 'notes',
        text: 'push with message'
      }
    };
    return html`
      <div class="doc-topbar">
        ${this.docHasChanges && !this.showCommitMessage
          ? html`
              <uprtcl-button-loading
                icon="unarchive"
                @click=${() => this.persistAll()}
                ?loading=${this.persistingAll}
              >
                push
              </uprtcl-button-loading>
              <uprtcl-help>
                <span>
                  Your current changes are safely stored on this device and won't be lost.<br /><br />
                  "Push" them if<br /><br />
                  <li>You are about to propose a merge.</li>
                  <br />
                  <li>
                    This draft is public and you want them to be visible to others.
                  </li>
                </span>
              </uprtcl-help>
            `
          : ''}
        ${this.showCommitMessage
          ? html`
              <uprtcl-textfield id="COMMIT_MESSAGE" label="Message"> </uprtcl-textfield>
              <uprtcl-icon-button icon="clear" @click=${this.cancelCommitClicked} button>
              </uprtcl-icon-button>
              <uprtcl-icon-button icon="done" @click=${this.acceptCommitClicked} button>
              </uprtcl-icon-button>
            `
          : ''}
      </div>
    `;
  }

  render() {
    if (LOGINFO) this.logger.log('render()', { doc: this.doc });

    if (this.reloading || this.doc === undefined) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    const editorClasses = ['editor-container'];

    if (!this.readOnly) {
      editorClasses.concat(['padding-bottom']);
    }

    return html`
      <div class=${editorClasses.join(' ')}>
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
        text-align: left;
      }
      .editor-container {
        position: relative;
        width: 100%;
      }
      .padding-bottom {
        padding-bottom: 20vh;
      }
      .click-area {
        flex-grow: 1;
      }
      .doc-topbar {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        z-index: 2;
      }
      .doc-topbar uprtcl-button-loading {
        opacity: 0.9;
        margin-right: 6px;
        width: 90px;
      }

      .row {
        margin-bottom: 8px;
        display: flex;
        flex-direction: row;
      }

      .evee-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .empty-evees-info {
        width: 30px;
        height: 10px;
      }

      .node-content {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        padding-right: 4px;
      }

      .node-mark {
        position: absolute;
        top: 0px;
        left: 0px;
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
