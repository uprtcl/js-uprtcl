import { LitElement, property, html, css } from 'lit-element';

import { servicesConnect } from '../../container/multi-connect.mixin';
import { Logger } from '../../utils/logger';

import { Evees } from '../evees.service';
import { RemoteEvees } from '../interfaces/remote.evees';

export class ProposalsList extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ attribute: false })
  loadingProposals: boolean = true;

  proposalsIds: string[] = [];
  remote!: RemoteEvees;
  evees!: Evees;

  async firstUpdated() {
    this.load();
  }

  async load() {
    if (!this.evees) return;
    if (!this.evees.client.searchEngine) throw new Error('searchEngine not registered');

    this.loadingProposals = true;
    this.logger.info('loadProposals');

    this.proposalsIds = await this.evees.client.searchEngine.proposals(this.perspectiveId);

    /** data on other perspectives (proposals are injected on them) */
    this.remote = await this.evees.getPerspectiveRemote(this.perspectiveId);

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
                            remote-id=${this.remote.id}
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
