import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { EveesModule, EveesWorkspace, Perspective, EveesDiff } from '@uprtcl/evees';
import { loadEntity } from '@uprtcl/multiplatform';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';

import { EveesBlockchainCached, UserPerspectivesDetails } from '../provider/evees.blockchain.cached';

export class EveesBlockchainUpdateDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-BLOCKCHAIN-UPDATE-DIFF');

  @property({ type: String, attribute: 'remote' })
  remoteId!: string;

  @property({ type: String })
  owner!: string;

  @property({ type: String, attribute: 'new-hash' })
  newHash!: string;
  
  @property({ type: Boolean })
  summary: boolean = false;

  @property({ attribute: false })
  loading: boolean = true;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  protected client!: ApolloClient<any>;
  protected recognizer!: PatternRecognizer;

  protected remote!: EveesBlockchainCached;
  protected workspace!: EveesWorkspace;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    const remote = (this.requestAll(EveesModule.bindings.EveesRemote) as EveesBlockchainCached[]).find(r => r.id === this.remoteId);
    if (!remote) {
        throw new Error(`remote ${this.remoteId} not found`)
    }
    this.remote = remote;
    this.load();
  }

  async load() {
    this.loading = true;

    const eveesData = await this.remote.getEveesDataOf(this.owner);
    const newEveesData = (await this.remote.store.get(this.newHash)) as UserPerspectivesDetails;
    
    /** compare the two evees objects and derive a workspace */
    this.workspace = new EveesWorkspace(this.client, this.recognizer);

    for (const perspectiveId in newEveesData) {
      if (eveesData[perspectiveId] !== undefined) {
        // update
        const newHead = newEveesData[perspectiveId].headId;
        if (newHead === undefined) {
          throw new Error(`Evee head cannot be undefined`);
        }

        if (eveesData[perspectiveId] !== newHead) {
          const update = {
            newHeadId: newHead,
            perspectiveId: perspectiveId,
            oldHeadId: eveesData[perspectiveId].headId
          }
  
          this.workspace.update(update);
        }
      } else {
        // new
        const perspective = await loadEntity<Signed<Perspective>>(this.client, perspectiveId);
        if (perspective === undefined) {
          throw new Error(`perspective ${perspectiveId} not found`);
        }
        const newPerspective = {
          details: {
            headId: newEveesData[perspectiveId].headId
          },
          perspective
        }
        this.workspace.newPerspective(newPerspective);
      }
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
