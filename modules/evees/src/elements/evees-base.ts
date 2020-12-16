import { property, css, LitElement, internalProperty } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { styles } from '@uprtcl/common-ui';
import {
  Entity,
  CortexModule,
  PatternRecognizer,
  Signed,
  HasChildren,
} from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';
import { loadEntity } from '@uprtcl/multiplatform';
import { EveesInfoConfig } from './evees-info-user-based';
import { EveesRemote } from 'src/services/evees.remote';
import { EveesConfig, Perspective } from 'src/types';
import { EveesBindings } from 'src/bindings';
import { EveesHelpers } from 'src/graphql/evees.helpers';

const entityStub = (object: any): Entity<any> => {
  return {
    id: '',
    object,
  };
};

export class EveesBaseElement<T> extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-BASE-ELEMENT');

  @property({ type: String })
  uref!: string;

  @property({ type: String })
  color!: string;

  @property({ type: Object })
  eveesInfoConfig!: EveesInfoConfig;

  @property({ type: Boolean })
  editable: boolean = false;

  @internalProperty()
  loading: boolean = true;

  @internalProperty()
  data: Entity<T> | undefined;

  @internalProperty()
  editableActual: boolean = false;

  protected currentHeadId!: string | undefined;
  protected remote!: EveesRemote;
  protected client!: ApolloClient<any>;
  protected remotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;
  protected editableRemotesIds!: string[];

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.remotes = this.requestAll(EveesBindings.EveesRemote);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    const config = this.request(EveesBindings.Config) as EveesConfig;
    this.editableRemotesIds = config.editableRemotesIds
      ? config.editableRemotesIds
      : [];

    this.logger.log('firstUpdated()', { uref: this.uref });

    this.loading = true;
    await this.load();
    this.loading = false;
  }

  async load() {
    if (this.uref === undefined) return;

    this.logger.log('load()');

    const perspective = (await loadEntity(this.client, this.uref)) as Entity<
      Signed<Perspective>
    >;

    const headId = await EveesHelpers.getPerspectiveHeadId(
      this.client,
      this.uref
    );
    this.currentHeadId = headId;

    const remoteId = perspective.object.payload.remote;
    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`remote ${remoteId} not found`);
    this.remote = remote;

    const canWrite = await EveesHelpers.canWrite(this.client, this.uref);

    this.editableActual =
      this.editableRemotesIds.length > 0
        ? this.editableRemotesIds.includes(this.remote.id) && canWrite
        : canWrite;

    this.data = await EveesHelpers.getPerspectiveData(this.client, this.uref);
  }

  async createEvee(object: T, remote: string) {
    if (!this.remotes) throw new Error('eveesRemotes undefined');
    if (!this.client) throw new Error('client undefined');

    const remoteInstance = this.remotes.find((r) => r.id === remote);
    if (!remoteInstance)
      throw new Error(`Remote not found for remote ${remote}`);

    const dataId = await EveesHelpers.createEntity(
      this.client,
      remoteInstance.store,
      object
    );
    const headId = await EveesHelpers.createCommit(
      this.client,
      remoteInstance.store,
      {
        dataId,
        parentsIds: [],
      }
    );
    return EveesHelpers.createPerspective(this.client, remoteInstance, {
      headId,
      parentId: this.uref,
    });
  }

  async updateContent(newData: T) {
    const dataId = await EveesHelpers.createEntity(
      this.client,
      this.remote.store,
      newData
    );
    const headId = await EveesHelpers.createCommit(
      this.client,
      this.remote.store,
      {
        dataId,
        parentsIds: this.currentHeadId ? [this.currentHeadId] : undefined,
      }
    );
    await EveesHelpers.updateHead(this.client, this.uref, headId);

    if ((this.remote as any).flush) {
      await (this.remote as any).flush();
    }

    this.logger.info('updateContent()', newData);

    await this.load();
  }

  /** new elements can be a string (uref) or an object (in which case a new Evee is created) */
  async spliceChildren(
    object: T,
    newElements: any[],
    index: number,
    count: number
  ) {
    const getNewChildren = newElements.map((page) => {
      if (typeof page !== 'string') {
        return this.createEvee(page, this.remote.id);
      } else {
        return Promise.resolve(page);
      }
    });

    const newChildren = await Promise.all(getNewChildren);

    /** get children pattern */
    const data = entityStub(object);

    const childrentPattern: HasChildren = this.recognizer
      .recognizeBehaviours(data)
      .find((b) => (b as HasChildren).getChildrenLinks);

    /** get array with current children */
    const children = childrentPattern.getChildrenLinks(data);

    /** updated array with new elements */
    const removed = children.splice(index, count, ...newChildren);
    const newEntity = childrentPattern.replaceChildrenLinks(data)(children);

    return {
      entity: newEntity,
      removed,
    };
  }

  async spliceChildrenAndUpdate(
    object: T,
    newElements: any[],
    index: number,
    count: number
  ) {
    const result = await this.spliceChildren(object, newElements, index, count);

    if (!result.entity) throw Error('problem with splice pages');

    await this.updateContent(result.entity.object);
  }

  async moveChild(fromIndex: number, toIndex: number): Promise<Entity<T>> {
    if (!this.data) throw new Error('wiki not defined');

    const { removed } = await this.spliceChildren(
      this.data.object,
      [],
      fromIndex,
      1
    );
    const result = await this.spliceChildren(
      this.data.object,
      removed as string[],
      toIndex,
      0
    );
    return result.entity;
  }

  async removeEveeChild(index: number): Promise<Entity<T>> {
    if (!this.data) throw new Error('data not defined');
    const result = await this.spliceChildren(this.data.object, [], index, 1);
    return result.entity;
  }
}
