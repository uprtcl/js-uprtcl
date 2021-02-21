import { LitElement, property, html, css, query } from 'lit-element';

import { MenuConfig, UprtclDialog } from '@uprtcl/common-ui';

import { Entity } from '../../cas/interfaces/entity';
import { Logger } from '../../utils/logger';
import { servicesConnect } from '../../container/multi-connect.mixin';

import { EveesDiff } from './evees-diff';
import { ContentUpdatedEvent } from './events';
import { RemoteWithUI } from '../interfaces/remote.with-ui';
import { Proposal } from '../proposals/types';

export class EveesProposalRow extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-PROPOSAL-ROW');

  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ attribute: false })
  loading = true;

  @property({ attribute: false })
  loadingCreator = true;

  @property({ attribute: false })
  showDiff: Boolean = false;

  @property({ attribute: false })
  authorId: string | undefined = undefined;

  @property({ attribute: false })
  authorRemote: string | undefined = undefined;

  @property({ attribute: false })
  canRemove: Boolean = false;

  @query('#updates-dialog')
  updatesDialogEl!: UprtclDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  proposal!: Proposal;
  executed = false;
  canExecute = false;

  protected toRemote!: RemoteWithUI;

  async firstUpdated() {
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('proposal-id')) {
      this.load();
    }
  }

  async load() {
    this.loading = true;
    this.loadingCreator = true;

    const proposal = await this.evees.client.store.getEntity(this.proposalId);
    const remote = this.evees.getRemote(proposal.object.remote);
    if (!remote.proposals) {
      throw new Error('Proposals not defined');
    }

    this.proposal = await remote.proposals.getProposal(this.proposalId);

    const fromPerspective = this.proposal.fromPerspectiveId
      ? await this.evees.client.store.getEntity(this.proposal.fromPerspectiveId)
      : undefined;

    this.toRemote = await this.evees.getPerspectiveRemote(this.proposal.toPerspectiveId);

    /** the author is the creator of the fromPerspective */
    this.authorId = fromPerspective ? fromPerspective.object.payload.creatorId : undefined;
    this.authorRemote = fromPerspective ? fromPerspective.object.payload.remote : undefined;
    this.loadingCreator = false;

    await this.checkCanExecute();
    await this.checkExecuted();

    /** the proposal creator is set at proposal creation */
    this.canRemove = this.evees.client.proposals
      ? await this.evees.client.proposals.canDelete(this.proposalId)
      : false;

    this.loading = false;
  }

  async checkIsOwner() {}

  async checkExecuted() {
    /* a proposal is considered accepted if all the updates are now ancestors of their target */
    const isAncestorVector = await Promise.all(
      this.proposal.mutation.updates
        .filter((u) => !!u.details.headId)
        .map((update) => {
          return this.evees.isAncestorCommit(
            update.perspectiveId,
            update.details.headId as string,
            update.oldDetails?.headId
          );
        })
    );

    this.executed = !isAncestorVector.includes(false);
  }

  async checkCanExecute() {
    /* check the update list, if user canUpdate on all the target perspectives,
    the user can execute the proposal */
    const canExecuteVector = await Promise.all(
      this.proposal.mutation.updates.map(
        async (update): Promise<boolean> => {
          return this.evees.client.canUpdate(update.perspectiveId);
        }
      )
    );

    this.canExecute = !canExecuteVector.includes(false);
  }

  async showProposalChanges() {
    const localEvees = this.evees.clone();
    await localEvees.client.update(this.proposal.mutation);

    this.showDiff = true;
    const options: MenuConfig = {};

    if (this.canExecute && !this.executed) {
      options['accept'] = {
        disabled: false,
        text: 'accept',
        icon: 'done',
      };
    }

    options['close'] = {
      disabled: false,
      text: 'close',
      icon: 'clear',
    };

    if (this.canExecute || this.canRemove) {
      options['delete'] = {
        disabled: false,
        text: 'delete',
        icon: 'delete',
        background: '#c93131',
      };
    }

    await this.updateComplete;

    this.eveesDiffEl.localEvees = localEvees;
    this.updatesDialogEl.options = options;

    const value = await new Promise((resolve) => {
      this.updatesDialogEl.resolved = (value) => {
        this.showDiff = false;
        resolve(value);
      };
    });

    this.dispatchEvent(new CustomEvent('dialogue-closed', { bubbles: true, composed: true }));
    this.showDiff = false;

    if (value === 'accept') {
      /** run the proposal changes as the logged user */
      await localEvees.client.flush();
      await this.evees.client.update({ deletedPerspectives: [this.proposalId] });

      this.load();

      this.dispatchEvent(
        new ContentUpdatedEvent({
          detail: { uref: this.proposal.toPerspectiveId },
          bubbles: true,
          composed: true,
        })
      );
    }

    if (value === 'delete') {
      await this.evees.client.update({ deletedPerspectives: [this.proposalId] });
      this.load();
    }
  }

  renderDiff() {
    return html`
      <uprtcl-dialog id="updates-dialog">
        <evees-update-diff id="evees-update-diff"> </evees-update-diff>
      </uprtcl-dialog>
    `;
  }

  renderDefault() {
    return html`
      <div @click=${() => this.showProposalChanges()} class="row-container">
        <div class="proposal-name">
          ${this.authorId !== undefined
            ? html`
                <evees-author
                  user-id=${this.authorId}
                  remote-id=${this.authorRemote as string}
                  show-name
                ></evees-author>
              `
            : 'unknown'}
        </div>
        <div class="proposal-state">
          ${this.loading
            ? html` <uprtcl-loading></uprtcl-loading> `
            : this.canExecute
            ? html`
                <uprtcl-icon-button
                  icon=${this.executed ? 'done' : 'call_merge'}
                  ?disabled=${this.executed}
                ></uprtcl-icon-button>
              `
            : ''}
        </div>
      </div>
      ${this.showDiff ? this.renderDiff() : ''}
    `;
  }

  render() {
    if (this.loadingCreator) {
      return html` <div class=""><uprtcl-loading></uprtcl-loading></div> `;
    }

    let renderDefault = true;
    let lense: any = undefined;
    if (this.toRemote && this.toRemote.proposal !== undefined) {
      renderDefault = false;
      lense = this.toRemote.proposal as any;
    }

    return renderDefault ? this.renderDefault() : lense().render({ proposalId: this.proposalId });
  }

  static get styles() {
    return css`
      :host {
        width: 100%;
      }
      .row-container {
        height: 100%;
        display: flex;
        flex-direction: row;
      }
      .proposal-name {
        height: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .proposal-state {
        width: 140px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .proposal-state uprtcl-button {
        margin: 0 auto;
      }
    `;
  }
}
