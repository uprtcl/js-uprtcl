import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, CortexModule } from '@uprtcl/cortex';

import { UpdateRequest, HasDiffLenses, DiffLens } from '../types';

import { EveesWorkspace } from '../services/evees.workspace';

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
      this.loadUpdates();
    }

    if (changedProperties.has('rootPerspective')) {
      this.loadUpdates();
    }
  }

  async loadUpdates() {
    if (!this.workspace) return;

    this.loading = true;

    const getDetails = this.workspace.getUpdates().map(async (update) => {
      const newData = await EveesHelpers.getCommitData(
        this.workspace.workspace,
        update.newHeadId
      );

      const oldData =
        update.oldHeadId !== undefined
          ? await EveesHelpers.getCommitData(
              this.workspace.workspace,
              update.oldHeadId
            )
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
      const newRoot = this.workspace
        .getNewPerspectives()
        .find(
          (newPerspective) =>
            newPerspective.perspective.id === this.rootPerspective
        );
      if (newRoot) {
        if (newRoot.details.headId) {
          const newData = await EveesHelpers.getCommitData(
            this.workspace.workspace,
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
        ${details.diffLense.render(
          this.workspace,
          details.newData,
          details.oldData,
          this.summary
        )}
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
