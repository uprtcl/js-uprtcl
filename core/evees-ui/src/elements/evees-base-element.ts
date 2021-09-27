import { property, LitElement, internalProperty } from 'lit-element';

import {
  ClientEvents,
  Commit,
  Entity,
  Evees,
  Logger,
  Perspective,
  ClientRemote,
  ConnectionLoggedEvents,
  Secured,
  Signed,
} from '@uprtcl/evees';

import { servicesConnect } from '../container/multi-connect.mixin';

export class EveesBaseElement<T extends object = object> extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-BASE-ELEMENT');

  @property({ type: String })
  uref!: string;

  @property({ type: String, attribute: 'ui-parent' })
  uiParentId!: string;

  @internalProperty()
  loading: boolean = true;

  @internalProperty()
  isLogged: boolean = false;

  @internalProperty()
  localEvees!: Evees;

  canUpdate!: boolean;
  guardianId!: string | undefined;

  perspective: Secured<Perspective> | undefined;
  head: Secured<Commit> | undefined;
  data: Entity<T> | undefined;

  protected remote!: ClientRemote;

  async firstUpdated() {
    this.setEvees();

    this.remote = await this.localEvees.getPerspectiveRemote(this.uref);

    this.checkLogged();

    if (this.remote.events) {
      this.remote.events.on(ConnectionLoggedEvents.logged_status_changed, () => this.checkLogged());
    }

    this.loading = true;
    await this.load();
    this.loading = false;

    const client = this.localEvees.getClient();
    if (client.events) {
      client.events.on(ClientEvents.updated, (perspectives) =>
        this.perspectiveUpdated(perspectives)
      );
    }
  }

  setEvees() {
    if (!this.localEvees) {
      this.localEvees = this.evees;
    }
  }

  async checkLogged() {
    this.isLogged = await this.remote.isLogged();
  }

  perspectiveUpdated(perspectives: string[]) {
    if (perspectives.includes(this.uref)) {
      this.load();
    }
  }

  updated(changedProperties) {
    if (
      (changedProperties.has('uref') && !changedProperties.uref) ||
      changedProperties.has('localEvees')
    ) {
      this.load();
    }
  }

  async load() {
    if (!this.localEvees) return;

    this.data = undefined;
    this.head = undefined;
    this.guardianId = undefined;

    if (this.uref === undefined) return;

    this.perspective = await this.localEvees.getEntity<Signed<Perspective>>(this.uref);
    const { details } = await this.localEvees.getPerspective(this.uref);
    this.canUpdate = details.canUpdate !== undefined ? details.canUpdate : false;
    this.guardianId = details.guardianId;

    if (details.headId) {
      this.head = await this.localEvees.getEntity<Signed<Commit>>(details.headId);
      this.data = await this.localEvees.getEntity<T>(this.head.object.payload.dataId);
    }

    await this.dataUpdated();

    this.requestUpdate();
  }

  // override this method to react to dataUpdated
  async dataUpdated(): Promise<void> {
    return Promise.resolve();
  }
}
