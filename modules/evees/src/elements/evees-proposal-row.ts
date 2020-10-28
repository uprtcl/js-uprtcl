import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Perspective, Proposal } from '../types';
import { EveesRemote } from 'src/services/evees.remote';
import { EveesBindings } from 'src/bindings';
import { MenuConfig, UprtclDialog } from '@uprtcl/common-ui';
import { EveesDiff } from './evees-diff';
import { EveesWorkspace } from '../services/evees.workspace';
import { ApolloClient } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import { EveesHelpers } from '../graphql/evees.helpers';
import { loadEntity } from '@uprtcl/multiplatform';
import { ContentUpdatedEvent } from './events';
import { ProposalsProvider } from 'src/services/proposals.provider';

export class EveesProposalRow extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PROPOSAL-ROW');

  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  loadingCreator: boolean = true;

  @property({ attribute: false })
  showDiff: Boolean = false;

  @property({ attribute: false })
  authorId: string | undefined = undefined;

  @property({ attribute: false })
  canRemove: Boolean = false;

  @query('#updates-dialog')
  updatesDialogEl!: UprtclDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  remote!: EveesRemote;
  proposals!: ProposalsProvider;
  proposal!: Proposal;
  executed: boolean = false;
  canExecute: boolean = false;

  protected client!: ApolloClient<any>;
  protected recognizer!: PatternRecognizer;
  protected eveesRemotes!: EveesRemote[];

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.eveesRemotes = this.requestAll(EveesBindings.EveesRemote);
    const remote = (this.requestAll(EveesBindings.EveesRemote) as EveesRemote[]).find(
      r => r.id === this.remoteId
    );
    if (remote === undefined) throw new Error(`remote ${this.remoteId} not found`);

    const proposals = remote.proposals;
    if (proposals === undefined)
      throw new Error(`remote ${this.remoteId} proposals provider not found`);

    this.remote = remote;
    this.proposals = proposals;

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

    if (this.remote.proposals === undefined)
      throw new Error(`remote ${this.remoteId} cant handle proposals`);

    this.proposal = await this.proposals.getProposal(this.proposalId);

    const fromPerspective = this.proposal.fromPerspectiveId
      ? await loadEntity<Signed<Perspective>>(this.client, this.proposal.fromPerspectiveId)
      : undefined;

    /** the author is the creator of the fromPerspective */
    this.authorId = fromPerspective ? fromPerspective.object.payload.creatorId : undefined;
    this.loadingCreator = false;

    await this.checkCanExecute();
    await this.checkExecuted();

    /** the proposal creator is set at proposal creation */
    this.canRemove = await this.remote.proposals.canRemove(this.proposalId);

    this.loading = false;
  }

  async checkIsOwner() {}

  async checkExecuted() {
    /* a proposal is considered accepted if all the updates are now ancestors of their target */
    const isAncestorVector = await Promise.all(
      this.proposal.details.updates.map(update => {
        return EveesHelpers.isAncestorCommit(
          this.client,
          update.perspectiveId,
          update.newHeadId,
          update.oldHeadId
        );
      })
    );

    this.executed = !isAncestorVector.includes(false);
  }

  async checkCanExecute() {
    /* check the update list, if user canWrite on all the target perspectives,
    the user can execute the proposal */
    const canExecuteVector = await Promise.all(
      this.proposal.details.updates.map(
        async (update): Promise<boolean> => {
          const remoteId = await EveesHelpers.getPerspectiveRemoteId(
            this.client,
            update.perspectiveId
          );
          const remote = this.eveesRemotes.find(remote => remote.id === remoteId);
          if (remote === undefined) throw new Error('remote undefined');
          return EveesHelpers.canWrite(this.client, update.perspectiveId);
        }
      )
    );

    this.canExecute = !canExecuteVector.includes(false);
  }

  async showProposalChanges() {
    const workspace = new EveesWorkspace(this.client, this.recognizer);
    for (const update of this.proposal.details.updates) {
      workspace.update(update);
    }

    for (const newPerspective of this.proposal.details.newPerspectives) {
      workspace.newPerspective(newPerspective);
    }

    /* new perspectives are added to the apollo cache to be able to read their head */
    await workspace.precacheNewPerspectives(this.client);

    this.showDiff = true;
    const options: MenuConfig = {};

    if (this.canExecute && !this.executed) {
      options['accept'] = {
        disabled: false,
        text: 'accept',
        icon: 'done'
      };
    }

    options['close'] = {
      disabled: false,
      text: 'close',
      icon: 'clear'
    };

    if (this.canExecute || this.canRemove) {
      options['delete'] = {
        disabled: false,
        text: 'delete',
        icon: 'delete',
        background: '#c93131'
      };
    }

    await this.updateComplete;

    this.eveesDiffEl.workspace = workspace;
    this.updatesDialogEl.options = options;

    const value = await new Promise(resolve => {
      this.updatesDialogEl.resolved = value => {
        this.showDiff = false;
        resolve(value);
      };
    });

    this.dispatchEvent(new CustomEvent('dialogue-closed', { bubbles: true, composed: true }));
    this.showDiff = false;

    if (value === 'accept') {
      /** run the proposal changes as the logged user */
      await workspace.execute(this.client);
      await this.proposals.deleteProposal(this.proposalId);

      this.load();

      this.dispatchEvent(
        new ContentUpdatedEvent({
          detail: { uref: this.proposal.toPerspectiveId },
          bubbles: true,
          composed: true
        })
      );
    }

    if (value === 'delete') {
      await this.proposals.deleteProposal(this.proposalId);
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
                <evees-author user-id=${this.authorId} show-name></evees-author>
              `
            : 'unknown'}
        </div>
        <div class="proposal-state">
          ${this.loading
            ? html`
                <uprtcl-loading></uprtcl-loading>
              `
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
      return html`
        <div class=""><uprtcl-loading></uprtcl-loading></div>
      `;
    }

    let renderDefault = true;
    let lense: any = undefined;
    if (this.remote && this.remote.proposals && this.remote.proposals.lense !== undefined) {
      renderDefault = false;
      lense = this.remote.proposals.lense as any;
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
