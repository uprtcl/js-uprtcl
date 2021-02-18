import { property, internalProperty } from 'lit-element';

import { Logger } from '../../utils/logger';
import { RemoteEvees } from '../interfaces/remote.evees';
import { EveesBaseElement } from './evees-base';

/** A base component for evees with one official perspective and one draft per user */
export class EveesBaseDraft<T extends object> extends EveesBaseElement<T> {
  logger = new Logger('EVEES-INFO-Draft');

  @internalProperty()
  loading = true;

  protected firstRef!: string;
  protected mineId: string | undefined = undefined;
  protected defaultRemote!: RemoteEvees;

  async firstUpdated() {
    this.firstRef = this.uref;
    this.defaultRemote =
      this.evees.remotes.length > 1 ? this.evees.remotes[1] : this.evees.remotes[0];
    super.firstUpdated();
  }

  async load() {
    super.load();

    /** it's assumed that there is only one fork per user un the remote  */
    const drafts = await this.defaultRemote.searchEngine.forks(this.firstRef);
    this.mineId = drafts.length > 0 ? drafts[0] : undefined;
  }

  checkoutDraft() {
    if (this.mineId) {
      this.seeDraft();
    } else {
      this.createDraft();
    }
  }

  async createDraft(recurse: boolean = true) {
    this.mineId = await this.evees.forkPerspective(
      this.firstRef,
      this.defaultRemote.id,
      undefined,
      recurse
    );
    this.seeDraft();
  }

  seeDraft() {
    if (!this.mineId) throw new Error(`mineId not defined`);
    this.uref = this.mineId;
  }

  seeOfficial() {
    this.uref = this.firstRef;
  }
}
