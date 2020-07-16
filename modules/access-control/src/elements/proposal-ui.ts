import { LitElement, property, html, query, css } from 'lit-element';
import { DAOProposal } from '../services/dao-connector.service';

import '@material/mwc-icon';

export class ProposalUI extends LitElement {
  @property({ type: Object })
  proposal!: DAOProposal;

  async firstUpdated() {}

  vote(value: boolean) {
    this.dispatchEvent(
      new CustomEvent('voted', {
        bubbles: true,
        composed: true,
        detail: { value },
      })
    );
  }

  render() {
    const yea = BigInt(this.proposal.yea);
    const votes = yea + BigInt(this.proposal.nay);
    const votedRatio =
      Number((votes * 10000n) / BigInt(this.proposal.possibleVotes)) / 10000.0;
    const approvedRatio =
      votes !== BigInt(0) ? Number((yea * 10000n) / votes) / 10000.0 : 0;

    return html`
      <div>
        <div class="row">
          <div class="vote-buttons">
            <div class="icon-container">
              <mwc-icon-button icon="clear" @click=${() => this.vote(false)}>
              </mwc-icon-button>
            </div>

            <div class="icon-container">
              <mwc-icon-button icon="done" @click=${() => this.vote(true)}>
              </mwc-icon-button>
            </div>
          </div>
        </div>
        <div class="row">
          <progress-bar progress=${votedRatio * 100}></progress-bar>
          <progress-bar progress=${approvedRatio * 100}></progress-bar>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      progress-bar {
        height: 10px;
        margin-bottom: 2px;
      }

      .row {
        width: 100%;
        display: block;
      }
    `;
  }
}
