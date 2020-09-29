import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesBindings, EveesRemote } from '@uprtcl/evees';

import { ProposalManifest } from './types';
import { EveesPolkadotCouncil } from './evees.polkadot-council';
import { loadEntity } from '@uprtcl/multiplatform';

export class EveesPolkadotCouncilProposal extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ attribute: false })
  loading!: boolean;

  client!: ApolloClient<any>;
  remote!: EveesPolkadotCouncil;

  proposalManifest!: ProposalManifest;

  async firstUpdated() {
    debugger;
    this.client = this.request(ApolloClientModule.bindings.Client);
    const remote = (this.requestAll(EveesBindings.EveesRemote) as EveesRemote[]).find(remote =>
      remote.id.includes('evees-council')
    );

    if (!remote) throw new Error(`council remote not registered`);
    this.remote = remote as EveesPolkadotCouncil;
    this.load();
  }

  async load() {
    this.loading = true;

    const proposalManifest = (await this.remote.store.get(this.proposalId)) as ProposalManifest;
    if (!proposalManifest) throw new Error('Proposal not found');
    this.proposalManifest = proposalManifest;

    this.loading = false;
  }

  render() {
    return this.loading
      ? html`
          <uprtcl-loading></uprtcl-loading>
        `
      : html`
          <div class="container">
            <pre class="prop-value">${JSON.stringify(this.proposalManifest, undefined, 2)}</pre>
          </div>
        `;
  }

  static get styles() {
    return css``;
  }
}
