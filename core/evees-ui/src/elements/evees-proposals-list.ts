import { LitElement, property, html, css, internalProperty } from 'lit-element';
import { Evees, Logger, ProposalEvents, RemoteEvees } from '@uprtcl/evees';

import { servicesConnect } from '../container/multi-connect.mixin';

export class ProposalsList extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @internalProperty()
  loadingProposals = true;

  @internalProperty()
  proposalsIds: string[] = [];

  remote!: RemoteEvees;
  evees!: Evees;

  async firstUpdated() {
    this.loadingProposals = true;
    this.proposalsIds = [];

    const proposals = this.evees.getProposals();

    if (proposals) {
      if (proposals.events) {
        proposals.events.on(ProposalEvents.created, () => this.load());
      }
    }

    this.load();
  }

  async load() {
    if (!this.evees) return;

    /** data on other perspectives (proposals are injected on them) */
    this.remote = await this.evees.getPerspectiveRemote(this.perspectiveId);

    const proposals = this.evees.getProposals();
    if (proposals) {
      this.proposalsIds = await proposals.getProposalsToPerspective(this.perspectiveId);
    }

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
      evees-proposal-row {
        height: 28px;
      }
    `;
  }
}
