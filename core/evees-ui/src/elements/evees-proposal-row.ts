import { LitElement, property, html, css, query } from 'lit-element';

import { MenuOptions, UprtclDialog } from '@uprtcl/common-ui';
import { Logger, Proposal, Evees } from '@uprtcl/evees';

import { servicesConnect } from '../container/multi-connect.mixin';

import { EveesDiffExplorer } from './evees-diff-explorer';
import { ContentUpdatedEvent } from './events';
import { RemoteWithUI } from '../interfaces/remote.with-ui';
import { ProposalsWithUI } from '../interfaces/proposals.with-ui';

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

  @query('#evees-diff-explorer')
  eveesDiffEl!: EveesDiffExplorer;

  proposal!: Proposal;
  executed = false;
  canExecute = false;

  protected toRemote!: RemoteWithUI;
  protected proposals!: ProposalsWithUI;
  protected proposalEvees!: Evees;

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

    const proposal = await this.evees.getEntity(this.proposalId);
    const remote = this.evees.getRemote(proposal.object.remote);

    if (!remote.proposals) {
      throw new Error('Proposals not defined');
    }

    this.proposal = await remote.proposals.getProposal(this.proposalId);

    const fromPerspective = this.proposal.fromPerspectiveId
      ? await this.evees.getEntity(this.proposal.fromPerspectiveId)
      : undefined;

    this.toRemote = await this.evees.getPerspectiveRemote(this.proposal.toPerspectiveId);

    const proposals = this.toRemote.proposals;
    if (!proposals) throw new Error('ToRemote dont have proposals service');
    this.proposals = proposals as ProposalsWithUI;

    /** the author is the creator of the fromPerspective */
    this.authorId = fromPerspective ? fromPerspective.object.payload.creatorId : undefined;
    this.authorRemote = fromPerspective ? fromPerspective.object.payload.remote : undefined;
    this.loadingCreator = false;

    /** create an Evees service that includes the proposal mutation */
    this.proposalEvees = this.evees.clone(`Proposal-${this.proposalId}`);
    await this.proposalEvees.update(this.proposal.mutation);

    await this.checkCanExecute();
    await this.checkExecuted();

    /** the proposal creator is set at proposal creation */
    this.canRemove = proposals ? await this.proposals.canDelete(this.proposalId) : false;

    this.loading = false;
  }

  async checkIsOwner() {}

  async checkExecuted() {
    /* a proposal is considered accepted if all the updates are now ancestors of their target */
    const isAncestorVector = await Promise.all(
      this.proposal.mutation.updates
        ? this.proposal.mutation.updates
            .filter((u) => !!u.details.headId)
            .map((update) => {
              return this.proposalEvees.isAncestorCommit(
                update.perspectiveId,
                update.details.headId as string
              );
            })
        : [true]
    );

    this.executed = !isAncestorVector.includes(false);
  }

  async checkCanExecute() {
    /* check the update list, if user canUpdate on all the target perspectives,
    the user can execute the proposal */
    const canExecuteVector = await Promise.all(
      this.proposal.mutation.updates
        ? this.proposal.mutation.updates.map(
            async (update): Promise<boolean> => {
              return this.proposalEvees.canUpdate(update.perspectiveId);
            }
          )
        : [true]
    );

    this.canExecute = !canExecuteVector.includes(false);
  }

  async showProposalChanges() {
    this.showDiff = true;
    const options: MenuOptions = new Map();

    if (this.canExecute && !this.executed) {
      options.set('accept', {
        disabled: false,
        text: 'accept',
        icon: 'done',
      });
    }

    options.set('close', {
      disabled: false,
      text: 'close',
      icon: 'clear',
    });

    if (this.canExecute || this.canRemove) {
      options.set('delete', {
        disabled: false,
        text: 'delete',
        icon: 'delete',
        background: '#c93131',
      });
    }

    await this.updateComplete;

    this.eveesDiffEl.localEvees = this.proposalEvees;
    this.eveesDiffEl.rootPerspective = this.proposal.toPerspectiveId;

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
      await this.proposalEvees.flush();

      /** delete the proposal (WHAT?) */
      await this.evees.update({ deletedPerspectives: [this.proposalId] });

      /** reload */
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
      await this.evees.update({ deletedPerspectives: [this.proposalId] });
      this.load();
    }
  }

  renderDiff() {
    return html`
      <uprtcl-dialog id="updates-dialog">
        <evees-diff-explorer id="evees-diff-explorer"> </evees-diff-explorer>
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
    if (this.proposals && this.proposals.lense) {
      renderDefault = false;
      lense = this.proposals.lense;
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
