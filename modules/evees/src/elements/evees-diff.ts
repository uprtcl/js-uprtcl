import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, CortexModule } from '@uprtcl/cortex';

import { UpdateRequest, HasDiffLenses, DiffLens } from '../types';

import { Client } from '../services/client.memory';

const LOGINFO = true;

interface UpdateDetails {
  update?: UpdateRequest;
  newData: any;
  oldData: any;
  diffLense: DiffLens;
}

export class EveesDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ type: String, attribute: 'root-perspective' })
  rootPerspective!: string;

  @property({ type: Boolean })
  summary: boolean = false;

  @property({ attribute: false })
  client!: Client;

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

    if (changedProperties.has('client')) {
      this.loadUpdates();
    }

    if (changedProperties.has('rootPerspective')) {
      this.loadUpdates();
    }
  }

  async loadUpdates() {
    if (!this.client) return;

    this.loading = true;

    const getDetails = this.client.getUpdates().map(async (update) => {
      const newData = await EveesHelpers.getCommitData(this.client.client, update.newHeadId);

      const oldData =
        update.oldHeadId !== undefined
          ? await EveesHelpers.getCommitData(this.client.client, update.oldHeadId)
          : undefined;

      const hasDiffLenses = this.recognizer
        .recognizeBehaviours(newData)
        .find((b) => (b as HasDiffLenses<any>).diffLenses);
      if (!hasDiffLenses) throw Error('hasDiffLenses undefined');

      this.updatesDetails[update.perspectiveId] = {
        diffLense: hasDiffLenses.diffLenses()[0],
        update,
        oldData,
        newData,
      };
    });

    await Promise.all(getDetails);

    /** if a new perspective with the root id is found,
     *  shown as an update from undefined head */
    if (this.rootPerspective) {
      const newRoot = this.client
        .getNewPerspectives()
        .find((newPerspective) => newPerspective.perspective.id === this.rootPerspective);
      if (newRoot) {
        if (newRoot.details.headId) {
          const newData = await EveesHelpers.getCommitData(
            this.client.client,
            newRoot.details.headId
          );

          const hasDiffLenses = this.recognizer
            .recognizeBehaviours(newData)
            .find((b) => (b as HasDiffLenses<any>).diffLenses);
          if (!hasDiffLenses) throw Error('hasDiffLenses undefined');

          this.updatesDetails[this.rootPerspective] = {
            diffLense: hasDiffLenses.diffLenses()[0],
            update: undefined,
            oldData: undefined,
            newData,
          };
        }
      }
    }

    this.loading = false;
  }

  renderUpdateDiff(details: UpdateDetails) {
    // TODO: review if old data needs to be
    return html`
      <div class="evee-diff">
        ${details.diffLense.render(this.client, details.newData, details.oldData, this.summary)}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    const perspectiveIds = Object.keys(this.updatesDetails);
    return perspectiveIds.length === 0
      ? html` <span><i>no changes found</i></span> `
      : perspectiveIds.map((perspectiveId) =>
          this.renderUpdateDiff(this.updatesDetails[perspectiveId])
        );
  }

  static get styles() {
    return css`
      :host {
        display: block;
        text-align: center;
      }
      .evee-diff {
        overflow: auto;
      }
    `;
  }
}
