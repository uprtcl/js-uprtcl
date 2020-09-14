import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { EveesWorkspace } from '../services/evees.workspace';
import { EveesRemote } from '../services/evees.remote';
import { EveesBindings } from '../bindings';
import { EveesDiff } from './evees-diff';

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

  protected client!: ApolloClient<any>;
  protected workspace!: EveesWorkspace;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
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

    const eveesRemote = (this.requestAll(EveesBindings.EveesRemote) as EveesRemote[]).find(
      remote => remote.id === this.remoteId
    );

    if (eveesRemote === undefined) throw new Error(`remote ${this.remoteId} not found`);
    if (eveesRemote.proposals === undefined)
      throw new Error(`proposal of remote ${this.remoteId} undefined`);
    const proposal = await eveesRemote.proposals.getProposal(this.proposalId);

    if (proposal === undefined)
      throw new Error(`proposal ${this.proposalId} not found on remote ${this.remoteId}`);
    this.workspace = new EveesWorkspace(this.client);

    for (const update of proposal.details.updates) {
      this.workspace.update(update);
    }
    for (const newPerspective of proposal.details.newPerspectives) {
      this.workspace.newPerspective(newPerspective);
    }

    this.loading = false;
    await this.updateComplete;

    this.eveesDiffEl.workspace = this.workspace;
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
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
