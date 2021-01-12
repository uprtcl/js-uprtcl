import { LitElement, property, html, css, query } from 'lit-element';

import { eveesConnect, Logger } from '@uprtcl/evees';

import { ClientOnMemory } from '../services/clients/client.memory';
import { EveesBindings } from '../bindings';
import { EveesDiff } from './evees-diff';
import { Evees } from '../services/evees.service';

export class EveesProposalDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PROPOSAL-DIFF');

  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ type: Boolean })
  summary: boolean = false;

  @property({ attribute: false })
  loading: boolean = true;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  protected evees!: Evees;

  async firstUpdated() {
    this.evees = this.request(EveesBindings.Evees);
    this.loadProposal();
  }

  async updated(changedProperties) {
    this.logger.log('updated()', changedProperties);

    if (changedProperties.has('proposalId')) {
      this.loadProposal();
    }
  }

  async loadProposal() {
    this.loading = true;

    const proposal = await this.evees.getPerspectiveData(this.proposalId);
    const client = new ClientOnMemory(this.evees.client, proposal.object.mutation);
    this.loading = false;
    await this.updateComplete;

    this.eveesDiffEl.client = client;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    return html`
      <evees-update-diff id="evees-update-diff" ?summary=${this.summary}> </evees-update-diff>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 30px 0px 30px 0px;
        text-align: center;
      }
    `;
  }
}
