import { LitElement, property, html } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { ProposalRef } from '../types';
import { Evees } from '../services/evees';
import { EveesBindings } from '../bindings';

export class EveesProposalControl extends moduleConnect(LitElement) {
  @property({ type: Object })
  proposalRef!: ProposalRef;

  @property({ attribute: false })
  details!: any;

  protected evees!: Evees;

  firstUpdated() {
    this.evees = this.request(EveesBindings.Evees);
    this.loadProposal();
  }

  updated(changedProperties) {
    if (changedProperties.has('proposalRef')) {
      this.loadProposal();
    }
  }

  async loadProposal() {
    debugger;
    if (this.proposalRef === undefined) return;

    this.evees = this.request(EveesBindings.Evees);
    const remote = await this.evees.getPerspectiveProviderById(
      this.proposalRef.perspectiveId
    );
    const proposal = await remote.proposals?.getProposal(this.proposalRef.id);
    this.details = proposal?.details;
  }

  render() {
    if (!this.details)
      return html` <cortex-loading-placeholder></cortex-loading-placeholder> `;

    return html` <cortex-pattern .pattern=${this.details}></cortex-pattern> `;
  }
}
