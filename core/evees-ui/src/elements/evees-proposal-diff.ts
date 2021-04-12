import { LitElement, property, html, css, query } from 'lit-element';
import { Logger } from '@uprtcl/evees';

import { servicesConnect } from '../container/multi-connect.mixin';
import { EveesDiffExplorer } from './evees-diff-explorer';

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

  @query('#evees-diff-explorer')
  eveesDiffEl!: EveesDiffExplorer;

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
    const localEvees = this.evees.clone('ProposalClient');
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
      <evees-diff-explorer id="evees-diff-explorer" ?summary=${this.summary}> </evees-diff-explorer>
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
