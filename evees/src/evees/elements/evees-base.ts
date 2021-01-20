import { property, LitElement, internalProperty } from 'lit-element';

import { Logger } from '../../utils/logger';
import { Entity } from '../../cas/interfaces/entity';
import { eveesConnect } from '../../container/evees-connect.mixin';

import { RemoteEvees } from '../interfaces/remote.evees';
import { EveesInfoConfig } from './evees-info-user-based';
import { runInThisContext } from 'vm';

export class EveesBaseElement<T extends object> extends eveesConnect(LitElement) {
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

  protected remote!: RemoteEvees;
  protected editableRemotesIds!: string[];

  async firstUpdated() {
    this.editableRemotesIds = this.evees.config.editableRemotesIds
      ? this.evees.config.editableRemotesIds
      : [];

    this.remote = await this.evees.getPerspectiveRemote(this.uref);

    this.loading = true;
    await this.load();
    this.loading = false;
  }

  async load() {
    if (this.uref === undefined) return;

    const { details } = await this.evees.client.getPerspective(this.uref);
    const canUpdate = details.canUpdate !== undefined ? details.canUpdate : false;

    this.editableActual =
      this.editableRemotesIds.length > 0
        ? this.editableRemotesIds.includes(this.remote.id) && canUpdate
        : canUpdate;

    this.data = await this.evees.getPerspectiveData(this.uref);
  }
}
