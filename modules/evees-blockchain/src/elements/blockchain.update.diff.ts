import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { EveesModule, EveesWorkspace, Perspective, EveesDiff } from '@uprtcl/evees';
import { loadEntity } from '@uprtcl/multiplatform';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';

import {
  EveesBlockchainCached,
  UserPerspectivesDetails
} from '../provider/evees.blockchain.cached';

export class EveesBlockchainUpdateDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-BLOCKCHAIN-UPDATE-DIFF');

  @property({ type: String, attribute: 'remote' })
  remoteId!: string;

  @property({ type: String })
  owner!: string;

  @property({ attribute: false })
  currentHash!: string | undefined;

  @property({ attribute: false })
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

    const remote = (this.requestAll(
      EveesModule.bindings.EveesRemote
    ) as EveesBlockchainCached[]).find(r => r.id === this.remoteId);
    if (!remote) {
      throw new Error(`remote ${this.remoteId} not found`);
    }
    this.remote = remote;
    this.load();
  }

  async load() {
    this.loading = true;

    this.newHash = await this.remote.createNewEveesData();
    this.currentHash = await this.remote.getEveesHeadOf(this.owner);

    const eveesData = await this.remote.getEveesDataFromHead(this.currentHash);
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

        if (eveesData[perspectiveId].headId !== newHead) {
          const update = {
            newHeadId: newHead,
            perspectiveId: perspectiveId,
            oldHeadId: eveesData[perspectiveId].headId
          };

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
        };
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
      <div class="prop-name">details:</div>
      <pre class="prop-value">
${JSON.stringify({ current: this.currentHash, new: this.newHash }, null, 2)}</pre
      >
      <evees-update-diff id="evees-update-diff" ?summary=${this.summary}> </evees-update-diff>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        text-align: center;
      }
      .prop-name {
        width: 100%;
      }
      .prop-value {
        font-family: Lucida Console, Monaco, monospace;
        font-size: 12px;
        text-align: left;
        background-color: #a0a3cb;
        color: #1c1d27;
        padding: 16px 16px;
        margin-bottom: 16px;
        border-radius: 6px;
        width: 100%;
        overflow: auto;
        width: calc(100% - 32px);
        overflow-x: auto;
      }
    `;
  }
}
