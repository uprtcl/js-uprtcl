import { LitElement, property } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Source, DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';
import {
  Pattern,
  Creatable,
  Hashed,
  Signed,
  HasChildren,
  PatternRecognizer,
  CortexModule
} from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { RemotesConfig, Commit, Perspective } from '../types';
import { EveesModule } from '../evees.module';
import {
  EveesRemote,
  EveesBindings,
  CreateCommitArgs,
  CreatePerspectiveArgs,
  UpdateContentEvent
} from '../uprtcl-evees';
import {
  CreateSyblingEvent,
  CREATE_SYBLING_TAG,
  ADD_SYBLINGS_TAG,
  AddSyblingsEvent,
  RemoveChildrenEvent,
  REMOVE_CHILDREN_TAG
} from './events';

export abstract class EveesContent<T> extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-CONTENT');

  @property({ type: Object })
  data: Hashed<T> | undefined = undefined;

  @property({ type: String })
  ref: string | undefined = undefined;

  @property({ type: Array })
  genealogy: string[] = [];

  @property({ type: Number })
  index: number = 0;

  @property({ type: String })
  color: string | undefined = undefined;

  @property({ type: Boolean })
  protected editable: Boolean = false;

  protected authority: string = '';
  protected currentHeadId: string | undefined = undefined;

  abstract symbol: string | undefined;
  abstract getEmptyEntity(): T;

  get level(): number {
    return this.genealogy.length;
  }

  protected remotesConfig: RemotesConfig | undefined = undefined;
  protected recognizer: PatternRecognizer | undefined = undefined;
  protected patterns: Pattern[] | undefined = undefined;
  protected client: ApolloClient<any> | undefined = undefined;
  protected eveesRemotes: EveesRemote[] | undefined = undefined;
  protected discovery: DiscoveryService | undefined = undefined;

  firstUpdated() {
    /** read all dependencies once for efficiency and to prevent unmounted requests */
    this.remotesConfig = this.request(EveesModule.bindings.RemotesConfig);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.discovery = this.request(DiscoveryModule.bindings.DiscoveryService);
  }

  getStore(eveesAuthority: string): Source | undefined {
    if (!this.remotesConfig) return undefined;
    return this.remotesConfig.map(eveesAuthority);
  }

  getCreatePatternOfObject(object: object) {
    if (!this.recognizer) return undefined;
    const create: Creatable<any, any> | undefined = this.recognizer
      .recognize(object)
      .find(prop => !!(prop as Creatable<any, any>).create);

    if (!create)
      throw new Error(`No creatable pattern registered for object ${JSON.stringify(object)}`);

    return create;
  }

  getCreatePatternOfSymbol(symbol: symbol) {
    const patterns: Pattern[] = this.requestAll(symbol);
    const create: Creatable<any, any> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as Creatable<any, any>).create
    ) as unknown) as Creatable<any, any>;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
  }

  getHasChildrenPatternOfObject(object: object) {
    if (!this.recognizer) return undefined;
    const hasChildren: HasChildren | undefined = this.recognizer
      .recognize(object)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren)
      throw new Error(`No hasChildren pattern registered for object ${JSON.stringify(object)}`);

    return hasChildren;
  }

  getHasChildrenPatternOfSymbol(symbol: symbol) {
    const patterns: Pattern[] = this.requestAll(symbol);
    const hasChildren: HasChildren<any> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as HasChildren<any>).create
    ) as unknown) as HasChildren<any>;

    if (!hasChildren)
      throw new Error(`No hasChildren pattern registered for a ${patterns[0].name}`);

    return hasChildren;
  }

  async updateRefData() {
    if (!this.ref) throw new Error('Ref is undefined');
    if (!this.client) throw new Error('client is undefined');

    const result = await this.client.query({
      query: gql`
      {
        entity(id: "${this.ref}") {
          id
          ... on Perspective {
            payload {
              origin
            }
            head {
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

    this.authority = result.data.entity.payload.origin;
    this.currentHeadId = result.data.entity.head.id;
    this.editable = result.data.entity._context.patterns.accessControl.canWrite;
  }

  async createEntity(content: object, symbol: symbol): Promise<Hashed<T>> {
    const creatable: Creatable<any, any> | undefined = this.getCreatePatternOfSymbol(symbol);
    if (creatable === undefined) throw new Error('Creatable pattern not found for this entity');
    const store = this.getStore(this.authority);
    if (!store) throw new Error('store is undefined');
    return creatable.create()(content, store.source);
  }

  async createEvee(content: object, symbol: symbol): Promise<string> {
    if (!this.authority) throw new Error('Authority undefined');
    if (!this.eveesRemotes) throw new Error('eveesRemotes undefined');

    const remote = this.eveesRemotes.find(r => r.authority === this.authority);

    if (!remote) throw new Error(`Remote not found for authority ${this.authority}`);

    const creatable = this.getCreatePatternOfSymbol(symbol);
    const store = this.getStore(this.authority);
    if (!store) throw new Error('store is undefined');
    const object = await creatable.create()(content, store.source);

    const creatableCommit: Creatable<
      CreateCommitArgs,
      Signed<Commit>
    > = this.getCreatePatternOfSymbol(EveesBindings.CommitPattern);
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
      this.authority
    );

    return perspective.id;
  }

  async updateContent(newContent: T) {
    if (this.symbol === undefined) throw new Error('this.symbol undefined');

    const object = await this.createEntity((newContent as unknown) as object, this.symbol);

    const dataId = object.id;

    this.logger.info('updateContent', { newContent, dataId });

    /* evees content creates the entity and then evees perspective is the one that 
       updates the perspective head */
    this.dispatchEvent(
      new UpdateContentEvent({
        bubbles: true,
        composed: true,
        detail: { dataId }
      })
    );
  }

  getChildren(data: object) {
    const hasChildren = this.getHasChildrenPatternOfObject(data);
    if (!hasChildren) throw new Error('hasChildren is undefined');

    return hasChildren.getChildrenLinks(data);
  }

  replaceChildren(data: object, links: string[]) {
    if (!this.data) throw new Error('data undefined');
    const hasChildren = this.getHasChildrenPatternOfObject(data);
    if (!hasChildren) throw new Error('hasChildren is undefined');

    return hasChildren.replaceChildrenLinks(data)(links);
  }

  async createChild(newNode: object, symbol: symbol, index?: number) {
    if (!this.data) return;

    const newLink = await this.createEvee(newNode, symbol);
    const links = this.getChildren((this.data as unknown) as object);

    index = index || 0;
    let newLinks: string[] = [...links];

    if (index >= links.length) {
      newLinks.push(newLink);
    } else {
      newLinks.splice(index, 0, newLink);
    }

    const newContent = this.replaceChildren((this.data as unknown) as object, newLinks);

    this.logger.info('createChild()', newContent);

    this.updateContent(newContent.object);
  }

  createSibling(object: object, symbol: symbol) {
    if (!this.data) return;

    this.logger.info('createSibling()', { dataId: this.data ? this.data.id : undefined });
    this.dispatchEvent(
      new CreateSyblingEvent({
        bubbles: true,
        composed: true,
        detail: {
          object: object,
          symbol: symbol,
          startedOnElementId: this.data.id,
          index: this.index + 1
        }
      })
    );
  }

  async moveChildElement(index: number, onIndex: number) {
    if (!this.data) return;

    const links = this.getChildren((this.data as unknown) as object);
    const elementId = links[index];

    let newLinks: string[] = [...links];
    /** remove */
    newLinks.splice(index, 1);
    newLinks.splice(onIndex, 0, elementId);

    const newContent = this.replaceChildren((this.data as unknown) as object, newLinks);

    this.logger.info('moveChildElement()', newContent);

    this.updateContent(newContent.object);
  }

  async removeChildElement(index: number) {
    if (!this.data) return;

    const links = this.getChildren((this.data as unknown) as object);
    const elementId = links[index];

    let newLinks: string[] = [...links];
    /** remove */
    newLinks.splice(index, 1);

    const newContent = this.replaceChildren((this.data as unknown) as object, newLinks);

    this.logger.info('removeChildElement()', newContent);

    this.updateContent(newContent.object);
  }

  addChildren(links: string[], index?: number) {
    if (!this.data) return;

    /** children are added to the bottom by default */
    const oldLinks = this.getChildren((this.data.object as unknown) as object);

    index = index || oldLinks.length;
    let newLinks: string[] = [...oldLinks];
    if (index >= oldLinks.length) {
      newLinks.push(...links);
    } else {
      newLinks.splice(index, 0, ...links);
    }

    const newContent = this.replaceChildren((this.data.object as unknown) as object, newLinks);

    this.updateContent(newContent);
  }

  removeChildren(fromIndex?: number, toIndex?: number) {
    if (!this.data) throw new Error('data is undefined');

    const oldLinks = this.getChildren((this.data.object as unknown) as object);

    /** children are added to the bottom by default */
    fromIndex = fromIndex || 0;
    toIndex = toIndex || oldLinks.length;

    let newLinks: string[] = [...oldLinks];
    newLinks.splice(fromIndex, toIndex - fromIndex + 1);

    const newContent = this.replaceChildren((this.data.object as unknown) as object, newLinks);

    this.updateContent(newContent);
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(CREATE_SYBLING_TAG, ((e: CreateSyblingEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${CreateSyblingEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.createChild(e.detail.object, e.detail.symbol, e.detail.index);
    }) as EventListener);

    this.addEventListener(ADD_SYBLINGS_TAG, ((e: AddSyblingsEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${AddSyblingsEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.addChildren(e.detail.elementIds, e.detail.index);
    }) as EventListener);

    this.addEventListener(REMOVE_CHILDREN_TAG, ((e: RemoveChildrenEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${RemoveChildrenEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.removeChildren(e.detail.fromIndex, e.detail.toIndex);
    }) as EventListener);
  }

  async getPerspectiveDataId(perspectiveId: string): Promise<string> {
    if (!this.client) throw new Error('client undefined');

    const result = await this.client.query({
      query: gql`
      {
        entity(id: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
              ... on Commit {
                data {
                  id
                }
              }
            }
          }
        }
      }`
    });

    return result.data.entity.head.data.id;
  }

  async getData(dataId: string): Promise<Hashed<object> | undefined> {
    if (!this.discovery) throw new Error('discovery undefined');
    return this.discovery.get(dataId);
  }

  async getPerspectiveData(perspectiveId: string): Promise<Hashed<object> | undefined> {
    const dataId = await this.getPerspectiveDataId(perspectiveId);
    return this.getData(dataId);
  }
}
