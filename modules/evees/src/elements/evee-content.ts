import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Source, DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';
import { Entity, Pattern, Creatable, Hashed, Signed, HasChildren } from '@uprtcl/cortex';
import { ApolloClientModule, gql } from '@uprtcl/graphql';

import { RemotesConfig, Commit, Perspective } from '../types';
import { EveesModule } from '../evees.module';
import { EveesRemote, EveesBindings, CreateCommitArgs, CreatePerspectiveArgs, UpdateContentEvent } from '../uprtcl-evees';
import { CreateSyblingEvent, CREATE_SYBLING_TAG, ADD_SYBLINGS_TAG, AddSyblingsEvent, RemoveChildrenEvent, REMOVE_CHILDREN_TAG } from './events';

export abstract class EveeContent<T> extends moduleConnect(LitElement) {
  logger = new Logger('EVEE-CONTENT');

  @property({ type: Object })
  data: Hashed<T> | undefined = undefined;

  @property({ type: Object })
  ref: string | undefined = undefined;

  @property({ type: Array })
  genealogy: string[] = [];

  @property({ type: Number })
  index: number = 0;

  @property({ type: String })
  color: string | undefined = undefined;

  protected authority: string = '';
  protected editable: Boolean = false;
  protected currentHeadId: string | undefined = undefined;

  abstract symbol: symbol | undefined;
  abstract getEmptyEntity(): T;

  get level():number {
    return this.genealogy.length;
  }

  getSource(eveesAuthority: string): Source {
    if(this.symbol === undefined) throw new Error('Symbold undefined');
    
    const remotesConfig: RemotesConfig = this.request(EveesModule.bindings.RemotesConfig);

    const entities: Entity[] = this.requestAll(this.symbol);
    const entityName = entities[0].name;

    return remotesConfig.map(eveesAuthority, entityName);
  }

  getCreatePattern(symbol) {
    const patterns: Pattern[] = this.requestAll(symbol);
    const create: Creatable<any, any> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as Creatable<any, any>).create
    ) as unknown) as Creatable<any, any>;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
  }

  async updateRefData() {
    if (!this.ref) throw new Error('Ref is undefined');

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`
      {
        entity(id: "${this.ref}") {
          id
          ... on Perspective {
            origin
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

    this.authority = result.data.entity.origin;
    this.currentHeadId = result.data.entity.head.id;
    this.editable = result.data.entity._context.patterns.accessControl.canWrite;
  }

  async createEntity(content: T) : Promise<Hashed<T>> {
    const creatable: Creatable<T, T> | undefined= this.getCreatePattern(this.symbol);
    if (creatable === undefined) throw new Error('Creatable pattern not found for this entity');
    return creatable.create()(content, this.getSource(this.authority).source);
  }

  async createEvee(content: T) : Promise<string> {
    if (!this.authority) throw new Error('Authority undefined');

    const eveesRemotes: EveesRemote[] = this.requestAll(EveesModule.bindings.EveesRemote);
    const remote = eveesRemotes.find(r => r.authority === origin);

    if (!remote) throw new Error(`Remote not found for authority ${origin}`);

    const creatable: Creatable<Partial<T>, T> = this.getCreatePattern(this.symbol);
    const object = await creatable.create()(content, this.getSource(origin).source);

    const creatableCommit: Creatable<CreateCommitArgs, Signed<Commit>> = this.getCreatePattern(
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
    > = this.getCreatePattern(EveesBindings.PerspectivePattern);
    
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
    const object =  await this.createEntity(newContent);

    const dataId = object.id;

    this.logger.info('updateContent', { newContent, dataId });

    /* evees content creates the entity and then evees perspective is the one that 
       updates the perspective head */
    this.dispatchEvent(new UpdateContentEvent({detail: {dataId}}));
  }

  getHasChildrenPattern(symbol) {
    const patterns: Pattern[] = this.requestAll(symbol);
    const hasChildren: HasChildren<T> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as HasChildren<T>).create
    ) as unknown) as HasChildren<T>;

    if (!hasChildren) throw new Error(`No hasChildren pattern registered for a ${patterns[0].name}`);

    return hasChildren;
  }

  getChildren(data: T) {
    return this.getHasChildrenPattern(this.symbol).getChildrenLinks(data);
  }

  replaceChildren(data: T, links: string[]) {
    if (!this.data) throw new Error('data undefined');
    return this.getHasChildrenPattern(this.symbol).replaceChildrenLinks(data)(links);
  }

  async createChild(newNode: T, index?: number) {
    if (!this.data) return;
    
    const newLink = await this.createEvee(newNode);
    const links = this.getChildren(this.data.object);

    index = index || 0;
    let newLinks: string[] = [...links];

    if (index >= links.length) {
      newLinks.push(newLink);
    } else {
      newLinks.splice(index, 0, newLink);
    }

    const newContent = this.replaceChildren(this.data.object, newLinks);

    this.logger.info('createChild()', newContent);

    this.updateContent(newContent);
  }

  createSibling() {
    if (!this.data) return;

    this.logger.info('createSibling()', { dataId: this.data ? this.data.id : undefined });
    this.dispatchEvent(
      new CreateSyblingEvent({
        bubbles: true,
        composed: true,
        detail: {
          startedOnElementId: this.data.id,
          index: this.index + 1
        }
      })
    );
  }

  addChildren(links: string[], index?: number) {
    if (!this.data) return;

    /** children are added to the bottom by default */
    const oldLinks = this.getChildren(this.data.object);
    
    index = index || oldLinks.length;
    let newLinks: string[] = [...oldLinks];
    if (index >= oldLinks.length) {
      newLinks.push(...links);
    } else {
      newLinks.splice(index, 0, ...links);
    }

    const newContent = this.replaceChildren(this.data.object, newLinks);

    this.updateContent(newContent);
  }

  removeChildren(fromIndex?: number, toIndex?: number) {
    if (!this.data) throw new Error('data is undefined');
    
    const oldLinks = this.getChildren(this.data.object);

    /** children are added to the bottom by default */
    fromIndex = fromIndex || 0;
    toIndex = toIndex || oldLinks.length;

    let newLinks: string[] = [...oldLinks];
    newLinks.splice(fromIndex, toIndex - fromIndex + 1);

    const newContent = this.replaceChildren(this.data.object, newLinks);

    this.updateContent(newContent);
  }

  connectedCallback() {
    this.addEventListener(CREATE_SYBLING_TAG, ((e: CreateSyblingEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${CreateSyblingEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.createChild(this.getEmptyEntity(), e.detail.index);
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
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
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
    const discovery: DiscoveryService = this.request(DiscoveryModule.bindings.DiscoveryService);
    return discovery.get(dataId);
  }

  async getPerspectiveData(perspectiveId: string): Promise<Hashed<object> | undefined> {
    const dataId = await this.getPerspectiveDataId(perspectiveId);
    return this.getData(dataId);
  }

}
