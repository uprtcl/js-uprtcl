import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Perspective, Proposal } from '../types';
import { EveesRemote } from 'src/services/evees.remote';
import { EveesBindings } from 'src/bindings';
import { UprtclDialog } from '@uprtcl/common-ui';
import { EveesDiff } from './evees-diff';
import { EveesWorkspace } from '../services/evees.workspace';
import { ApolloClient } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import { EveesHelpers } from '../graphql/evees.helpers';
import { loadEntity } from '@uprtcl/multiplatform';
import { Lens } from '@uprtcl/lenses';

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
  creatorId: string | undefined = undefined;

  @query('#updates-dialog')
  updatesDialogEl!: UprtclDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  remote!: EveesRemote | undefined;
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

    this.remote = (this.requestAll(EveesBindings.EveesRemote) as EveesRemote[]).find(
      r => r.id === this.remoteId
    );

    if (this.remote === undefined) throw new Error(`remote ${this.remoteId} not found`);
    if (this.remote.proposals === undefined)
      throw new Error(`remote ${this.remoteId} cant handle proposals`);

    this.proposal = await this.remote.proposals.getProposal(this.proposalId);

    const fromPerspective = this.proposal.fromPerspectiveId
      ? await loadEntity<Signed<Perspective>>(this.client, this.proposal.fromPerspectiveId)
      : undefined;

    this.creatorId = fromPerspective?.object.payload.creatorId;

    this.loadingCreator = false;

    await this.checkCanExecute();
    await this.checkExecuted();

    this.loading = false;
  }

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

    if (this.canExecute && !this.executed) {
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

    if (this.canExecute && !this.executed && value) {
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

  renderDefault() {
    return html`
      <div @click=${() => this.showProposalChanges()} class="row-container">
        <div class="proposal-name">
          ${this.creatorId !== undefined
            ? html`
                <evees-author user-id=${this.creatorId} show-name></evees-author>
              `
            : 'unknown'}
        </div>
        <div class="proposal-state">
          ${this.loading
            ? html`
                <uprtcl-loading></uprtcl-loading>
              `
            : html`
                <uprtcl-button
                  icon=${this.executed ? 'done' : this.canExecute ? 'call_merge' : ''}
                  skinny
                  ?disabled=${this.executed}
                  >${this.executed ? 'merged' : this.canExecute ? 'merge' : ''}</uprtcl-button
                >
              `}
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
