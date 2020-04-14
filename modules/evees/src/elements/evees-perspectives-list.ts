import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Proposal } from '../types';
import { styleMap } from './evees-info-popper';
import { DEFAULT_COLOR } from './support';
import { prettyTime, prettyAddress, eveeColor } from './support';

interface PerspectiveData {
  id: string;
  name: string;
  authority: string;
  creatorId: string;
  timestamp: number;
  publicRead: boolean;
}

const MERGE_ACTION: string = 'Merge';
const MERGE_PROPOSAL_ACTION: string = 'Propose';
const PENDING_ACTION: string = 'Pending';
const AUTHORIZE_ACTION: string = 'Authorize';
const EXECUTE_ACTION: string = 'Execute';
const MERGE_EXECUTED: string = 'Accepted';
const PRIVATE_PERSPECTIVE: string = 'Private';

export class PerspectivesList extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'first-perspective-id' })
  firstPerspectiveId!: string;

  @property({ type: Boolean, attribute: false })
  loadingPerspectives: boolean = true;

  @property({ type: Boolean, attribute: false })
  loadingProposals: boolean = true;

  perspectivesData: PerspectiveData[] = [];

  @property({ type: Array, attribute: false })
  acceptedPerspectiveData?: PerspectiveData;
  
  @property({ type: Array, attribute: false })
  pendingProposals: Proposal[] = [];

  @property({ type: Array, attribute: false })
  otherPerspectivesData: PerspectiveData[] = [];

  @property({ type: Array, attribute: false })
  mergedProposals: Proposal[] = [];

  @property({ type: String, attribute: false })
  canWrite: Boolean = false;

  @property({ type: String, attribute: 'force-update' })
  forceUpdate: string = 'true';

  protected client: ApolloClient<any> | undefined = undefined;
  
  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
  }

  load() {
    this.loadPerspectives();
    this.loadProposals();
  }

  perspectiveClicked(id: string) {
    this.dispatchEvent(
      new CustomEvent('perspective-selected', {
        bubbles: true,
        composed: true,
        detail: {
          id
        }
      })
    );
  }

  updated(changedProperties) {
    if(changedProperties.has('forceUpdate')) {
      this.logger.log('updating getOtherPersepectivesData')
      this.load();
    }
    if(changedProperties.has('perspectiveId') || changedProperties.has('firstPerspectiveId')) {
      this.logger.log('updating getOtherPersepectivesData')
      this.load();
    }
  }

  loadPerspectives = async () => {
    this.loadingPerspectives = true;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`{
          entity(id: "${this.perspectiveId}") {
            id
            ... on Perspective {
              payload {
                authority
              }
              context {
                id
                perspectives {
                  id
                  name
                  payload {
                    creatorId
                    timestamp
                    authority
                  }
                  _context {
                    patterns {
                      accessControl {
                        permissions
                      }
                    }
                  }
                } 
              }
            }
            _context {
              patterns {
                accessControl {
                  canWrite
                }
              }
            }
          }
        }`
    });

    /** data on this perspective */
    this.canWrite = result.data.entity._context.patterns.accessControl.canWrite;

    /** data on other perspectives (proposals are injected on them) */
    this.perspectivesData = result.data.entity.context.perspectives
      .map((perspective):PerspectiveData => {
        const publicRead = perspective._context.patterns.accessControl.permissions.publicRead !== undefined ? 
          perspective._context.patterns.accessControl.permissions.publicRead : 
          true;

        return {
          id: perspective.id,
          name: perspective.name,
          creatorId: perspective.payload.creatorId,
          timestamp: perspective.payload.timestamp,
          authority: perspective.payload.authority,
          publicRead: publicRead
        };
      });

    this.acceptedPerspectiveData = this.perspectivesData.find(
      perspectiveData => perspectiveData.id === this.firstPerspectiveId);
    
    this.otherPerspectivesData = this.perspectivesData.filter(
      perspectiveData => (perspectiveData.id !== this.firstPerspectiveId && perspectiveData.id !== this.perspectiveId));

    this.loadingPerspectives = false;

    this.logger.info('getOtherPersepectives() - post', {
      persperspectivesData: this.perspectivesData
    });
  };

  async loadProposals() {
    const client = this.client as ApolloClient<any>;
    this.loadingProposals = true;

    this.logger.info('loadProposals')
    
    const result = await client.query({
      query: gql`{
          entity(id: "${this.perspectiveId}") {
            id
            ... on Perspective {
              proposals {
                id
                fromPerspective {
                  id
                }
                authorized
                canAuthorize
                executed
                updates
              }
            }
          }
        }`
    });

    const proposals = result.data.entity.proposals.map(
      (prop): Proposal => {
        return {
          id: prop.id,
          fromPerspectiveId: prop.fromPerspective.id,
          authorized: prop.authorized,
          canAuthorize: prop.canAuthorize,
          executed: prop.executed
        };
      }
    );

    /** data on other perspectives (proposals are injected on them) */
    this.pendingProposals = proposals.filter(proposal => proposal.executed !== true);
    this.mergedProposals = proposals.filter(proposal => proposal.executed === true);

    this.loadingProposals = false;

    this.logger.info('getProposals()', { proposals });
  };

  perspectiveTitle(perspectivesData: PerspectiveData) {
    return html`
      ${perspectivesData.name !== ''
        ? html`
            <strong>${perspectivesData.name}</strong>
          `
        : 'created'}
      by ${prettyAddress(perspectivesData.creatorId)} ${prettyTime(perspectivesData.timestamp)}
    `;
  }

  perspectiveColor(perspectiveId: string) {
    if (perspectiveId === this.firstPerspectiveId) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(perspectiveId);
    }
  }

  proposalTitle(proposal: Proposal) {
    const perspectiveData = this.perspectivesData.find(p => p.id === proposal.fromPerspectiveId);
    if (perspectiveData) return this.perspectiveTitle(perspectiveData);
    return '';
  }

  proposalColor(proposal: Proposal) {
    return this.perspectiveColor(proposal.fromPerspectiveId);
  }

  perspectiveButtonClicked(perspectiveData: PerspectiveData) {
    switch (this.getPerspectiveAction(perspectiveData)) {
      case MERGE_ACTION:
        this.dispatchEvent(
          new CustomEvent('merge-perspective', {
            bubbles: true,
            composed: true,
            detail: {
              perspectiveId: perspectiveData.id
            }
          })
        );
        break;

      case MERGE_PROPOSAL_ACTION:
        this.dispatchEvent(
          new CustomEvent('create-proposal', {
            bubbles: true,
            composed: true,
            detail: {
              perspectiveId: perspectiveData.id
            }
          })
        );
        break;
    }
  }

  proposalButtonClicked(proposal: Proposal) {
    switch (this.getProposalAction(proposal)) {
      case AUTHORIZE_ACTION:
        this.dispatchEvent(
          new CustomEvent('authorize-proposal', {
            bubbles: true,
            composed: true,
            detail: {
              proposalId: proposal.id,
              perspectiveId: this.perspectiveId,
            }
          })
        );
        break;

      case EXECUTE_ACTION:
        this.dispatchEvent(
          new CustomEvent('execute-proposal', {
            bubbles: true,
            composed: true,
            detail: {
              proposalId: proposal.id,
              perspectiveId: this.perspectiveId
            }
          })
        );
        break;
    }
  }

  getPerspectiveAction(perspectiveData: PerspectiveData) {
    if (this.canWrite) {
      return MERGE_ACTION;
    } else {
      if (perspectiveData.publicRead) {
        return MERGE_PROPOSAL_ACTION;
      } else {
        return PRIVATE_PERSPECTIVE;
      }
    }
  }

  getProposalAction(proposal: Proposal): string {
    if (!proposal.authorized) {
      if (proposal.canAuthorize) {
        return AUTHORIZE_ACTION;
      } else {
        return PENDING_ACTION;
      }
    } else {
      if (proposal.executed === undefined || !proposal.executed) {
        return EXECUTE_ACTION;
      } else {
        return MERGE_EXECUTED;
      }
    }
  }

  getPerspectiveActionDisaled(perspectiveData: PerspectiveData) {
    return [MERGE_ACTION, PRIVATE_PERSPECTIVE].includes(this.getPerspectiveAction(perspectiveData));
  }

  getProposalActionDisaled(proposal: Proposal) {
    return [PENDING_ACTION, MERGE_EXECUTED].includes(this.getProposalAction(proposal));
  }

  renderLoading() {
    return html`
      <div class="loading-container">
        <cortex-loading-placeholder></cortex-loading-placeholder>
      </div>
    `;
  }

  renderPerspectiveRow(perspectiveData: PerspectiveData | undefined) {
    if (perspectiveData === undefined) return html``;
    return html`
      <div class="list-row">
        <div class="perspective-title">
          <mwc-list-item
            @click=${() => this.perspectiveClicked(perspectiveData.id)}
            graphic="small"
          >
            <div
              slot="graphic"
              class="perspective-mark"
              style="${styleMap({
                backgroundColor: this.perspectiveColor(perspectiveData.id)
              })})"
            ></div>
            <div>
              <span class="perspective-name">
                ${this.perspectiveTitle(perspectiveData)}
              </span>
            </div>
          </mwc-list-item>
        </div>
        <div class="perspective-action">
          <mwc-button
            class="merge-button"
            icon="call_merge"
            class="merge-button"
            @click=${() => this.perspectiveButtonClicked(perspectiveData)}
            label=${this.getPerspectiveAction(perspectiveData)}
            .disabled=${this.getPerspectiveActionDisaled(perspectiveData)}
          ></mwc-button>
        </div>
      </div>
    `;
  }

  renderProposalRow(proposal: Proposal) {
    return html`
      <div class="list-row">
        <div class="perspective-title">
          <mwc-list-item
            graphic="small"
            disabled
          >
            <div
              slot="graphic"
              class="perspective-mark"
              style="${styleMap({
                backgroundColor: this.proposalColor(proposal)
              })})"
            ></div>
            <div>
              <span class="perspective-name">
                ${this.proposalTitle(proposal)}
              </span>
            </div>
          </mwc-list-item>
        </div>
        <div class="perspective-action">
          <mwc-button
            class="merge-button"
            icon="call_merge"
            class="merge-button"
            @click=${() => this.proposalButtonClicked(proposal)}
            label=${this.getProposalAction(proposal)}
            .disabled=${this.getProposalActionDisaled(proposal)}
          ></mwc-button>
        </div>
      </div>
    `;
  }
  
  renderAcceptedPerspective() {
    return this.perspectiveId !== this.firstPerspectiveId ? html`
      <div class='list-section'><strong>Official Version</strong></div>
      ${this.renderPerspectiveRow(this.acceptedPerspectiveData)}` : '';
  }

  renderProposals() {
    return this.pendingProposals.length > 0 ? html`
      <div class='list-section'><strong>Update Proposals</strong></div>
      ${this.pendingProposals.map(
      proposal => this.renderProposalRow(proposal))}` : '';
  }

  renderPerspectives() {
    return this.otherPerspectivesData.length > 0 ? html`
      <div class='list-section'><strong>Drafts</strong></div>
      ${this.otherPerspectivesData.map(
      perspectiveData => this.renderPerspectiveRow(perspectiveData))}` : '';

  }

  renderOldProposals() {
    return this.mergedProposals.length > 0 ? html`
    <div class='list-section'><strong>Old Proposals</strong></div>
    ${this.mergedProposals.map(
    proposal => this.renderProposalRow(proposal))}` : '';
  }

  render() {
    return (this.loadingPerspectives || this.loadingProposals) ? 
      this.renderLoading() : 
      html`
        ${this.perspectivesData.length > 1
          ? html`
              <mwc-list activatable>
                ${this.renderAcceptedPerspective()}
                ${this.renderProposals()}
                ${this.renderPerspectives()}
                ${this.renderOldProposals()}
              </mwc-list>
            `
          : html`
              <div class="empty"><i>No drafts found</i></div>
            `}
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

      .perspective-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        margin-left: 8px;
      }

      .list-row {
        width: 100%;
        display: flex;
      }

      .list-section {
        text-align: left;
        padding: 6px 12px 0px 16px;
        font-size: 14px;
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
    `;
  }
}
