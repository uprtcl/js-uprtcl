import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { EveesModule, EveesWorkspace, Perspective, EveesDiff } from '@uprtcl/evees';
import { loadEntity } from '@uprtcl/multiplatform';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';

import { EveesBlockchainCached } from '../provider/evees.blockchain.cached';
import { UserPerspectivesDetails } from '../types';

export class EveesBlockchainUpdateDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-BLOCKCHAIN-UPDATE-DIFF');

  @property({ type: String, attribute: 'remote' })
  remoteId!: string;

  @property({ type: String, attribute: 'current-hash' })
  currentHash!: string | undefined;

  @property({ type: String, attribute: 'new-hash' })
  newHash!: string;

  @property({ type: Boolean })
  summary: boolean = false;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  nNew!: number;

  @property({ attribute: false })
  nUpdated!: number;

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

    this.nNew = this.workspace.getNewPerspectives().length;
    this.nUpdated = this.workspace.getUpdates().length;

    this.loading = false;
    await this.updateComplete;

    /** set the workspace of the evees diff once it is shown */
    if (this.eveesDiffEl !== null) {
      this.eveesDiffEl.workspace = this.workspace;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    return html`
      <div class="row">
        <div class="column">
          <div class="prop-name">current head</div>
          <pre class="prop-value">${this.currentHash}</pre>
        </div>
        ${this.newHash !== this.currentHash
          ? html`
              <div class="column">
                <div class="prop-name">new head</div>
                <pre class="prop-value">${this.newHash}</pre>
              </div>
            `
          : ''}
      </div>

      <div class="row">
        <ul>
          <li>new perspectives: ${this.workspace.getNewPerspectives().length}</li>
          <li>perspectives updated: ${this.workspace.getUpdates().length}</li>
        </ul>
      </div>

      ${this.nUpdated > 0
        ? html`
            <evees-update-diff id="evees-update-diff" ?summary=${this.summary}> </evees-update-diff>
          `
        : ''}
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        text-align: left;
        display: flex;
        flex-direction: column;
      }
      .row {
        width: 100%;
        display: flex;
      }
      .column {
        flex: 1 1 auto;
        padding: 0px 16px;
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
      ul {
        margin-top: 0px;
      }
      evees-update-diff {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
    `;
  }
}
