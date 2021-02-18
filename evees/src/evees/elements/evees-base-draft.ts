import { html, css, property, query, LitElement, internalProperty } from 'lit-element';

import { MenuConfig, UprtclPopper } from '@uprtcl/common-ui';

import { Logger } from '../../utils/logger';
import { Secured } from '../../cas/utils/cid-hash';

import { Perspective } from '../interfaces/types';
import { RemoteEvees } from '../interfaces/remote.evees';

import { EveesInfoBase } from './evees-info-base';
import { EveesPerspectivesList } from './evees-perspectives-list';
import { ProposalsList } from './evees-proposals-list';
import { DEFAULT_COLOR, eveeColor } from './support';
import { ContentUpdatedEvent } from './events';
import { servicesConnect } from 'src/container/multi-connect.mixin';
import { EveesBaseElement } from './evees-base';
import { RecursiveContextMergeStrategy } from '../merge/recursive-context.merge-strategy';

export interface EveesInfoConfig {
  showProposals?: boolean;
  showDraftControl?: boolean;
  showMyDraft?: boolean;
  showInfo?: boolean;
  showIcon?: boolean;
  showAcl?: boolean;
  showDebugInfo?: boolean;
  officialOwner?: string;
  checkOwner?: boolean;
  isDraggable?: boolean;
}

/** A base component for evees with one official perspective and one draft per user */
export class EveesBaseDraft<T extends object> extends EveesBaseElement<T> {
  logger = new Logger('EVEES-INFO-Draft');

  @property({ type: String, attribute: 'remote' })
  defaultRemoteId!: string;

  @internalProperty()
  loading = true;

  protected firstRef!: string;
  protected mineId: string | undefined = undefined;
  protected defaultRemote!: RemoteEvees;

  async firstUpdate() {
    this.firstRef = this.uref;
    this.defaultRemote = this.evees.getRemote(this.defaultRemoteId);
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
