import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css, query } from 'lit-element';

import { loadEntity } from '@uprtcl/multiplatform';
import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';

import { Proposal, Perspective } from '../types';
import { eveeColor } from './support';

import { EveesWorkspace } from '../services/evees.workspace';
import { UprtclDialog } from '@uprtcl/common-ui';
import { EveesDiff } from './evees-diff';

export const DEFAULT_COLOR = '#d0dae0';
import { Signed } from '@uprtcl/cortex';

const PENDING_ACTION: string = 'Pending';
const AUTHORIZE_ACTION: string = 'Authorize';
const EXECUTE_ACTION: string = 'Execute';
const MERGE_EXECUTED: string = 'Accepted';

export class ProposalsList extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ attribute: false })
  loadingProposals: boolean = true;

  @property({ attribute: false })
  pendingProposals: Proposal[] = [];

  @property({ attribute: false })
  mergedProposals: Proposal[] = [];

  @property({ attribute: false })
  showDiff: Boolean = false;

  @property({ attribute: false })
  showHistory: Boolean = false;

  @property({ attribute: 'force-update' })
  forceUpdate: string = 'true';

  @query('#updates-dialog')
  updatesDialogEl!: UprtclDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  protected client!: ApolloClient<any>;

  async firstUpdated() {
    if (!this.isConnected) return;

    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  async load() {
    if (!this.isConnected) return;

    this.loadingProposals = true;

    this.logger.info('loadProposals');

    const result = await this.client.query({
      query: gql`{
          entity(uref: "${this.perspectiveId}") {
            id
            ... on Perspective {
              proposals {
                id
                fromPerspective {
                  id
                }
                canExecute
                executed
                updates {
                  toPerspective {
                    id
                  }
                  fromPerspective {
                    id
                  }
                  oldHead {
                    id 
                  }
                  newHead {
                    id
                  }
                }
              }
            }
          }
        }`
    });

    const getProposals: Proposal[] = result.data
      ? result.data.entity.proposals.map(
          async (prop): Promise<Proposal> => {
            const updates =
              prop.updates !== null
                ? prop.updates.map(update => {
                    return {
                      perspectiveId: update.toPerspective.id,
                      fromPerspectiveId: update.fromPerspective.id,
                      oldHeadId: update.oldHead.id,
                      newHeadId: update.newHead.id
                    };
                  })
                : [];

            return {
              id: prop.id,
              toPerspectiveId: prop.toPerspective.id,
              fromPerspectiveId: prop.fromPerspective.id,
              creatorId: prop.creatorId,
              canExecute: prop.canExecute,
              executed: prop.executed,
              details: {
                newPerspectives: [],
                updates
              }
            };
          }
        )
      : [];

    const proposals = await Promise.all(getProposals);

    /** data on other perspectives (proposals are injected on them) */
    this.pendingProposals = proposals.filter(proposal => proposal.executed !== true);
    this.mergedProposals = proposals.filter(proposal => proposal.executed === true);

    this.loadingProposals = false;

    this.logger.info('getProposals()', { proposals });
  }

  updated(changedProperties) {
    if (changedProperties.has('forceUpdate')) {
      this.logger.log('updating proposals');
      this.load();
    }
    if (changedProperties.has('perspectiveId')) {
      this.logger.log('updating proposals');
      this.load();
    }
  }

  async showProposalChanges(proposal: Proposal) {
    const workspace = new EveesWorkspace(this.client);
    for (const update of proposal.details.updates) {
      workspace.update(update);
    }

    for (const newPerspective of proposal.details.newPerspectives) {
      workspace.newPerspective(newPerspective);
    }

    this.showDiff = true;
    await this.updateComplete;

    this.eveesDiffEl.workspace = workspace;

    const canAuthorize = this.getProposalAction(proposal) === AUTHORIZE_ACTION;
    if (canAuthorize) {
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

    if (canAuthorize && value) {
      this.authorizeProposal(proposal);
    }
  }

  authorizeProposal(proposal: Proposal) {
    this.dispatchEvent(
      new CustomEvent('authorize-proposal', {
        bubbles: true,
        composed: true,
        detail: {
          proposalId: proposal.id,
          perspectiveId: this.perspectiveId
        }
      })
    );
  }

  getProposalAction(proposal: Proposal): string {
    if (proposal.executed === undefined || !proposal.executed) {
      return EXECUTE_ACTION;
    } else {
      return MERGE_EXECUTED;
    }
  }

  getProposalActionDisaled(proposal: Proposal) {
    return [PENDING_ACTION, MERGE_EXECUTED].includes(this.getProposalAction(proposal));
  }

  renderLoading() {
    return html`
      <div class="loading-container">
        <uprtcl-loading></uprtcl-loading>
      </div>
    `;
  }

  renderProposalRow(proposal: Proposal) {
    return html`
      <uprtcl-list-item hasMeta @click=${() => this.showProposalChanges(proposal)}>
        <evees-author
          color=${proposal.fromPerspectiveId
            ? eveeColor(proposal.fromPerspectiveId)
            : DEFAULT_COLOR}
          user-id=${proposal.creatorId as string}
        ></evees-author>

        ${!this.getProposalActionDisaled(proposal)
          ? html`
              <uprtcl-button slot="meta" icon="call_merge" skinny>
                approve
              </uprtcl-button>
            `
          : ''}
      </uprtcl-list-item>
    `;
  }

  renderProposals() {
    return this.pendingProposals.length > 0
      ? html`
          ${this.pendingProposals.map(proposal => this.renderProposalRow(proposal))}
        `
      : '';
  }

  renderOldProposals() {
    if (this.mergedProposals.length === 0) return '';

    return html`
      <div class="list-section">
        <strong
          >Old Proposals
          <span class="inline-button" @click=${() => (this.showHistory = !this.showHistory)}
            >(${this.showHistory ? 'hide' : 'show'})</span
          >
        </strong>
      </div>
      ${this.showHistory
        ? this.mergedProposals.map(proposal => this.renderProposalRow(proposal))
        : ''}
    `;
  }

  renderDiff() {
    this.logger.log('renderDiff()');
    return html`
      <uprtcl-dialog id="updates-dialog">
        <evees-update-diff id="evees-update-diff"> </evees-update-diff>
      </uprtcl-dialog>
    `;
  }

  render() {
    return this.loadingProposals
      ? this.renderLoading()
      : html`
          ${this.pendingProposals.length > 0 || this.mergedProposals.length > 0
            ? html`
                <uprtcl-list activatable>
                  ${this.renderProposals()} ${this.renderOldProposals()}
                </uprtcl-list>
              `
            : html`
                <div class="empty"><i>No proposals found</i></div>
              `}
          ${this.showDiff ? this.renderDiff() : ''}
        `;
  }

  static get styles() {
    return css`
      :host {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
      .row {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex: 1;
      }
      .loading-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .perspective-mark {
        height: 30px;
        width: 10px;
        border-radius: 4px;
        float: left;
      }

      .list-row {
        width: 100%;
        display: flex;
      }

      .list-section {
        text-align: left;
        padding: 6px 12px 0px 16px;
        color: #4e585c;
      }

      .perspective-title {
        flex-grow: 1;
      }

      .perspective-action {
        display: flex;
        flex-direction: column;
        padding-right: 16px;
        justify-content: center;
      }

      .button-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding-right: 16px;
      }

      .empty {
        margin-top: 60px;
        color: #d0d8db;
        text-align: center;
      }

      .inline-button {
        cursor: pointer;
        text-decoration: underline;
        color: #2196f3;
      }

      @media (max-width: 768px) {
        .proposals,
        .perspectives {
          flex-direction: column;
        }
      }
    `;
  }
}
