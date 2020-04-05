import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Source, DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';
import { Pattern, Creatable, Hashed, Signed, HasChildren, PatternRecognizer, CortexModule } from '@uprtcl/cortex';
import { ApolloClientModule, gql } from '@uprtcl/graphql';

import { RemotesConfig, Commit, Perspective } from '../types';
import { EveesModule } from '../evees.module';
import { EveesRemote, EveesBindings, CreateCommitArgs, CreatePerspectiveArgs, UpdateContentEvent, Secured, UPDATE_HEAD } from '../uprtcl-evees';
import { SpliceChildrenEvent, SPLICE_CHILDREN_TAG, LiftChildrenEvent, LIFT_CHILDREN_TAG } from './events';

export abstract class EveesContent<T> extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-CONTENT');

  @property({ type: Object, attribute: 'data' })
  dataInit: Hashed<T> | undefined = undefined;

  @property({ type: Object, attribute: false })
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

  abstract symbol: symbol | undefined;
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

    if (this.dataInit) {
      this.data = {...this.dataInit};
      this.logger.log(`firstUpdated()`, { thisdata: this.data, thisdatainit: this.dataInit });
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(SPLICE_CHILDREN_TAG, ((e: SpliceChildrenEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${SpliceChildrenEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.spliceChildren(e.detail.elements, e.detail.index, e.detail.toIndex, e.detail.appendBackwards, e.detail.liftBackwards, e.detail.focusAfter);
    }) as EventListener);

    this.addEventListener(LIFT_CHILDREN_TAG, ((e: LiftChildrenEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${LiftChildrenEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.liftChildElement(e.detail.index);
    }) as EventListener);

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

    if (!create) throw new Error(`No creatable pattern registered for object ${JSON.stringify(object)}`);

    return create;
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

  getHasChildrenPatternOfObject(object: object) {
    if (!this.recognizer) return undefined;
    const hasChildren: HasChildren | undefined = this.recognizer
      .recognize(object)
      .find(prop => !!(prop as HasChildren).getChildrenLinks);

    if (!hasChildren) throw new Error(`No hasChildren pattern registered for object ${JSON.stringify(object)}`);

    return hasChildren;
  }

  getHasChildrenPatternOfSymbol(symbol: symbol) {
    this.logger.log(`getHasChildrenPatternOfSymbol(${symbol.toString()})`);

    const patterns: Pattern[] = this.requestAll(symbol);
    const hasChildren: HasChildren<any> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as HasChildren<any>).create
    ) as unknown) as HasChildren<any>;

    if (!hasChildren) throw new Error(`No hasChildren pattern registered for a ${patterns[0].name}`);

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
      this.authority
    );

    return perspective.id;
  }

  async updateContent(newContent: T) {
    if (this.symbol === undefined) throw new Error('this.symbol undefined');

    const object = await this.createEntity(newContent as unknown as object, this.symbol);

    const dataId = object.id;

    this.logger.info('updateContent', { newContent, dataId });

    /* evees content creates the entity and then evees perspective is the one that 
       updates the perspective head */
    this.dispatchEvent(new UpdateContentEvent({
      bubbles: true,
      composed: true,
      detail: { dataId }
    }));
  }

  async updateContentLocal(newContent: T): Promise<void> {
    if (!this.data) throw new Error('undefined data');
    if (!this.eveesRemotes) throw new Error('eveesRemotes data');
    if (this.symbol === undefined) throw new Error('this.symbol undefined');
    if (!this.client) throw new Error('client is undefined');

    const object = await this.createEntity(newContent as unknown as object, this.symbol);
    
    /** local update of data */
    this.data = {...object};
    this.logger.info('updateContentLocal()', { thisdata: this.data, thisref: this.ref, newContent });

    const remote = this.eveesRemotes.find(r => r.authority === this.authority);
    if (!remote) throw new Error('remote undefined');;

    const creatableCommit: Creatable<CreateCommitArgs, Signed<Commit>> = this.getCreatePatternOfSymbol(
      EveesModule.bindings.CommitPattern
    );
    
    const commit: Secured<Commit> = await creatableCommit.create()(
      {
        parentsIds: this.currentHeadId ? [this.currentHeadId] : [],
        dataId: object.id
      },
      remote.source
    );

    const headUpdate = await this.client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.ref,
        headId: commit.id
      }
    });
  }

  getChildren(data: object) {
    const hasChildren = this.getHasChildrenPatternOfObject(data);
    if (!hasChildren) throw new Error('hasChildren is undefined');

    return hasChildren.getChildrenLinks(data);
  }

  async spliceChildren(elements?: string[], index?: number, toIndex?: number, appendBackwards?: string, liftBackwards?: string[], focusAfter?: number) {
    if (!this.data) throw new Error('data undefined');
    const result = await this.spliceChildrenOf(this.data.object, elements, index, toIndex);
    await this.updateContentLocal(result.entity);
    return result;
  }

  async spliceChildrenOf(data: any, elements?: any[], index?: number, toIndex?: number) : Promise<{entity: any, removed: string[]}> {
    const hasChildren = this.getHasChildrenPatternOfObject(data);
    if (!hasChildren) throw new Error('hasChildren is undefined');

    const currentChildren = hasChildren.getChildrenLinks(data);

    elements = elements || [];
    index = index !== undefined ? index : currentChildren.length;
    toIndex = toIndex !== undefined ? toIndex : index;

    /** create objects if elements is not an id */
    const create = elements.map(el => {
      if (typeof el !== 'string') {
        return this.createEvee(el.object, el.symbol);
      } else {
        return Promise.resolve(el);
      }
    })

    const elementsIds = await Promise.all(create);

    let newChildren = [...currentChildren];
    const removed = newChildren.splice(index, toIndex - index, ...elementsIds);
    const entity = hasChildren.replaceChildrenLinks(data)(newChildren);

    return { entity, removed };
  }

  async createChild(newEntity: any, symbol: symbol, index?: number) {
    if (!this.data) return;

    const newLink = await this.createEvee(newEntity, symbol);
    const { entity } = await this.spliceChildren([newLink], index);

    this.logger.info('createChild()', entity);
    await this.updateContentLocal(entity);
    return
  }

  createSibling(object: object, symbol: symbol) {
    if (!this.data) return;

    this.logger.info('createSibling()', { dataId: this.data ? this.data.id : undefined, object });
    this.dispatchEvent(
      new SpliceChildrenEvent({
        bubbles: true,
        composed: true,
        detail: {
          elements: [{object, symbol}],
          startedOnElementId: this.data.id,
          index: this.index + 1,
          focusAfter: this.index + 1
        }
      })
    );
  }

  removeFromParent(content: string | undefined, lift: string[]) {
    if (!this.data) return;

    this.logger.info('removeFromParent()', { dataId: this.data ? this.data.id : undefined });
    this.dispatchEvent(
      new SpliceChildrenEvent({
        bubbles: true,
        composed: true,
        detail: {
          elements: [],
          startedOnElementId: this.data.id,
          index: this.index,
          toIndex: this.index + 1,
          appendBackwards: content,
          liftBackwards: lift 
        }
      })
    );
  }

  spliceParent(elements: string[], index?: number, toIndex?: number, appendBackwards?: string, focusAfter?: number) {
    if (!this.data) return;

    this.logger.info('spliceParent()', { dataId: this.data ? this.data.id : undefined, elements, index, appendBackwards, focusAfter });
    this.dispatchEvent(
      new SpliceChildrenEvent({
        bubbles: true,
        composed: true,
        detail: {
          startedOnElementId: this.data.id,
          elements, index, toIndex, appendBackwards, focusAfter
        }
      })
    );
  }

  async moveChildElement(index: number, onIndex: number) {
    /** remove */
    const { removed } = await this.spliceChildren([], index, index + 1);
    /** add */
    await this.spliceChildren(removed, onIndex);
  }

  async liftChildElement(index: number) {
    /** remove as child */
    const { removed } = await this.spliceChildren([], index, index + 1);
    /** add to parent */
    this.spliceParent(removed, this.index + 1);
  }

  /** tells the parent to lift its i-th child, which is this node */
  lift() {
    if (!this.data) return;

    this.logger.info('lift()', { dataId: this.data ? this.data.id : undefined });
    this.dispatchEvent(
      new LiftChildrenEvent({
        bubbles: true,
        composed: true,
        detail: {
          startedOnElementId: this.data.id,
          index: this.index,
          toIndex: this.index + 1
        }
      })
    );
  }
  
  async getPerspectiveDataId(perspectiveId: string): Promise<string> {
    if(!this.client) throw new Error('client undefined');

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
