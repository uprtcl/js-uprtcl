import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { DAOConnector, DAOProposal } from '../services/dao-connector.service';
import { AragonConnector } from '../services/aragon-connector';

export class VotingWidget extends moduleConnect(LitElement) {
  @property({ type: String })
  address!: string;

  @property({ type: String, attribute: 'vote-id' })
  voteId!: string;

  @property({ attribute: false })
  loading: boolean = false;

  proposal!: DAOProposal;

  daoConnector!: DAOConnector;

  async firstUpdated() {
    this.loading = true;
    const ethConnection = this.request(
      'EthereumConnection'
    ) as EthereumConnection;

    this.daoConnector = new AragonConnector(ethConnection);
    await this.daoConnector.connect(this.address);

    this.proposal = await this.daoConnector.getDaoProposal(this.voteId);
    this.loading = false;
  }

  async voted(value: boolean) {
    await this.daoConnector.vote(this.proposal.id, value);
  }

  render() {
    if (this.loading)
      return html` <cortex-loading-placeholder></cortex-loading-placeholder> `;

    return html`
      <proposal-ui
        .proposal=${this.proposal}
        @voted=${(e) => this.voted(e.detail.value)}
      ></proposal-ui>
    `;
  }

  static get styles() {
    return css``;
  }
}
