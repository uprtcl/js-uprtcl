import { LitElement, property, html, css, query } from 'lit-element';
import { servicesConnect } from 'src/container/multi-connect.mixin';

import { Logger } from '../../utils/logger';
import { ClientOnMemory } from '../clients/client.memory';

import { EveesDiff } from './evees-diff';

export class EveesProposalDiff extends servicesConnect(LitElement) {
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

  async firstUpdated() {
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
    const localEvees = this.evees.clone();
    await localEvees.client.update(proposal.object.mutation);

    this.loading = false;
    await this.updateComplete;

    this.eveesDiffEl.localEvees = localEvees;
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
