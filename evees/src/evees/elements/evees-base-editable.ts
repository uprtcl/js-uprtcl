import { css, html, internalProperty } from 'lit-element';

import { Logger } from '../../utils/logger';
import { RemoteEvees } from '../interfaces/remote.evees';
import { RemoteLoggedEvents } from '../interfaces/remote.logged';
import { EveesBaseElement } from './evees-base';

/** A base component for evees with one official perspective and one draft per user */
export class EveesBaseEditable<T extends object> extends EveesBaseElement<T> {
  logger = new Logger('EVEES-INFO-Draft');

  @internalProperty()
  isDraft = false;

  @internalProperty()
  hasOfficial = false;

  protected firstRef!: string;
  protected mineId: string | undefined = undefined;
  protected editRemote!: RemoteEvees;

  async firstUpdated() {
    this.firstRef = this.uref;
    this.remote = this.evees.remotes[0];
    this.editRemote = this.evees.remotes.length > 1 ? this.evees.remotes[1] : this.evees.remotes[0];

    await super.firstUpdated();

    if (this.remote.events) {
      this.remote.events.on(RemoteLoggedEvents.logged_out, () => this.seeOfficial());
      this.remote.events.on(RemoteLoggedEvents.logged_status_changed, () => this.load());
    }
  }

  async load() {
    await super.load();

    this.hasOfficial = true;

    /** it's assumed that there is only one fork per user on the remote  */
    const drafts = await this.editRemote.searchEngine.forks(this.firstRef);
    this.mineId = drafts.length > 0 ? drafts[0] : undefined;
    if (this.firstRef === this.mineId) {
      this.isDraft = true;
      this.hasOfficial = false;
    }
    this.logger.log('BaseDraft -- load() set mineId', this.mineId);
  }

  async checkoutDraft(recurse: boolean = true) {
    if (this.mineId) {
      return this.seeDraft();
    } else {
      return this.createDraft(recurse);
    }
  }

  async toggleDraft() {
    if (this.isDraft) {
      this.checkoutDraft();
    } else {
      this.seeOfficial();
    }
  }

  async createDraft(recurse: boolean = true): Promise<void> {
    this.mineId = await this.evees.forkPerspective(
      this.firstRef,
      this.editRemote.id,
      undefined,
      recurse
    );
    await this.evees.client.flush();
    this.logger.log('BaseDraft -- createDraft()', this.mineId);
    return this.seeDraft();
  }

  async seeDraft(): Promise<void> {
    this.logger.log('seeDraft -- seeDraft()', this.mineId);
    if (!this.mineId) throw new Error(`mineId not defined`);
    this.uref = this.mineId;
    this.isDraft = true;
    return this.load();
  }

  async seeOfficial(): Promise<void> {
    this.logger.log('BaseDraft -- seeOfficial()', this.mineId);
    this.uref = this.firstRef;
    this.isDraft = false;
    return this.load();
  }

  renderInfo() {
    return html`<div class="toggle-container">
      <span>official</span
      ><uprtcl-toggle
        @click=${() => (this.hasOfficial ? this.toggleDraft() : null)}
        ?active=${this.isDraft}
        ?disabled=${!this.hasOfficial}
      ></uprtcl-toggle
      ><span>draft</span>
    </div>`;
  }

  static get styles() {
    return [
      css`
        .toggle-container {
          display: flex;
        }
      `,
    ];
  }
}
