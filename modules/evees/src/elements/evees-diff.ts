import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { PatternRecognizer, CortexModule } from '@uprtcl/cortex';

import { UpdateRequest, HasDiffLenses, DiffLens } from '../types';

import { EveesWorkspace } from '../uprtcl-evees';
import { getCommitData } from '../graphql/helpers';

const LOGINFO = true;

interface UpdateDetails {
  update: UpdateRequest,
  newData: any,
  oldData: any,
  diffLense: DiffLens
}

export class EveesDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ attribute: false })
  workspace!: EveesWorkspace;

  @property({ attribute: false })
  loading: boolean = true;

  updatesDetails: Dictionary<UpdateDetails> = {};

  protected recognizer!: PatternRecognizer;

  async firstUpdated() {
    this.logger.log('firstUpdated()');
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    this.loadUpdates();
  }

  async updated(changedProperties) {
    this.logger.log('updated()', changedProperties);

    if (changedProperties.has('workspace')) {
      this.loadUpdates()
    }
  }

  async loadUpdates() {
    if (!this.workspace) return;

    this.loading = true;

    const getDetails = this.workspace.getUpdates().map(async (update) => {
      const newData = await getCommitData(this.workspace.workspace, update.newHeadId); 
      const oldData = await getCommitData(this.workspace.workspace, update.newHeadId); 

      const hasDiffLenses = this.recognizer.recognizeBehaviours(oldData).find(b => (b as HasDiffLenses<any>).diffLenses);
      if (!hasDiffLenses) throw Error('hasDiffLenses undefined');

      this.updatesDetails[update.perspectiveId] = {
        diffLense: hasDiffLenses.diffLenses()[0],
        update,
        oldData,
        newData
      } 
    });

    await Promise.all(getDetails);

    this.loading = false;
  }

  renderUpdateDiff(details: UpdateDetails) {
    // TODO: review if old data needs to be
    return html`
      <div class="evee-diff">
        ${details.diffLense.render(this.workspace, details.newData, details.oldData)}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;
    }

    const perspectiveIds = Object.keys(this.updatesDetails);
    return perspectiveIds.length === 0 ? 
        html`<span><i>no changes found</i></span>` : 
        perspectiveIds.map(perspectiveId => this.renderUpdateDiff(this.updatesDetails[perspectiveId]));
  }

  static get styles() {
    return css``;
  }
}
