import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';

export class ProposalsList extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ attribute: false })
  loadingProposals: boolean = true;

  proposalsIds: string[] = [];
  remoteId!: string;
  client!: EveesClient;

  async firstUpdated() {
    if (!this.isConnected) return;

    this.client = this.request(EveesClientModule.bindings.Client);
    this.load();
  }

  async load() {
    if (!this.isConnected) return;
    if (!this.client) return;

    this.loadingProposals = true;
    this.logger.info('loadProposals');

    const result = await this.client.query({
      query: gql`{
          entity(uref: "${this.perspectiveId}") {
            id
            ... on Perspective {
              proposals
            }
          }
        }`,
    });

    /** data on other perspectives (proposals are injected on them) */
    this.proposalsIds = result.data.entity.proposals;
    this.remoteId = await EveesHelpers.getPerspectiveRemoteId(
      this.client,
      this.perspectiveId
    );

    this.loadingProposals = false;
    this.logger.info('getProposals()', { proposalsIds: this.proposalsIds });
  }

  updated(changedProperties) {
    if (changedProperties.has('perspectiveId')) {
      this.logger.log('updating proposals');
      this.load();
    }
  }

  render() {
    return this.loadingProposals
      ? html`
          <div class="loading-container">
            <uprtcl-loading></uprtcl-loading>
          </div>
        `
      : html`
          ${this.proposalsIds.length > 0
            ? html`
                <uprtcl-list>
                  ${this.proposalsIds.map(
                    (id) =>
                      html`
                        <uprtcl-list-item
                          ><evees-proposal-row
                            proposal-id=${id}
                            remote-id=${this.remoteId}
                          ></evees-proposal-row
                        ></uprtcl-list-item>
                      `
                  )}
                </uprtcl-list>
              `
            : html`
                <uprtcl-list-item>
                  <i>No proposals found</i>
                </uprtcl-list-item>
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
      .loading-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
    `;
  }
}
