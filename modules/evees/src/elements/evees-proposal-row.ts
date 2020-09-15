import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Proposal } from '../types';
import { EveesRemote } from 'src/services/evees.remote';
import { EveesBindings } from 'src/bindings';
import { UprtclDialog } from '@uprtcl/common-ui';
import { EveesDiff } from './evees-diff';
import { EveesWorkspace } from '../services/evees.workspace';
import { ApolloClient } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { EveesHelpers } from '../graphql/helpers';

export class EveesProposalRow extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PROPOSAL-ROW');

  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  showDiff: Boolean = false;

  @query('#updates-dialog')
  updatesDialogEl!: UprtclDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  remote!: EveesRemote | undefined;
  proposal!: Proposal;
  canExecute: boolean = false;

  protected client!: ApolloClient<any>;
  protected recognizer!: PatternRecognizer;
  protected eveesRemotes!: EveesRemote[];

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.eveesRemotes = this.requestAll(EveesBindings.EveesRemote);
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('proposal-id')) {
      this.load();
    }
  }

  async load() {
    this.loading = true;
    this.remote = (this.requestAll(EveesBindings.EveesRemote) as EveesRemote[]).find(
      r => r.id === this.remoteId
    );

    if (this.remote === undefined) throw new Error(`remote ${this.remoteId} not found`);
    if (this.remote.proposals === undefined)
      throw new Error(`remote ${this.remoteId} cant handle proposals`);

    this.proposal = await this.remote.proposals.getProposal(this.proposalId);
    await this.checkCanExecute();

    this.loading = false;
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
          const remote = (this.eveesRemotes as EveesRemote[]).find(
            remote => remote.id === remoteId
          );
          if (remote === undefined) throw new Error('remote undefined');
          return remote.canWrite(update.perspectiveId);
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
    await this.updateComplete;

    this.eveesDiffEl.workspace = workspace;

    if (this.canExecute) {
      this.updatesDialogEl.primaryText = 'accept';
      this.updatesDialogEl.secondaryText = 'close';
      this.updatesDialogEl.showSecondary = 'true';
    } else {
      this.updatesDialogEl.primaryText = 'close';
    }

    const value = await new Promise(resolve => {
      this.updatesDialogEl.resolved = value => {
        this.showDiff = false;
        resolve(value);
      };
    });

    this.showDiff = false;

    if (this.canExecute && value) {
      await workspace.execute(this.client);
    }
  }

  renderDiff() {
    return html`
      <uprtcl-dialog id="updates-dialog">
        <evees-update-diff id="evees-update-diff"> </evees-update-diff>
      </uprtcl-dialog>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="">${this.proposalId} <uprtcl-loading></uprtcl-loading></div>
      `;
    }

    return html`
      <div @click=${() => this.showProposalChanges()} class="">
        ${this.proposal.fromPerspectiveId}
      </div>
      ${this.showDiff ? this.renderDiff() : ''}
    `;
  }

  static get styles() {
    return css``;
  }
}
