import { LitElement, property, html, css } from 'lit-element';

import { Logger } from '../../utils/logger';
import { PatternRecognizer } from '../../patterns/recognizer/pattern-recognizer';
import { servicesConnect } from '../../container/multi-connect.mixin';

import { Update, HasDiffLenses, DiffLens } from '../interfaces/types';
import { Client } from '../interfaces/client';

const LOGINFO = true;

interface UpdateDetails {
  update?: Update;
  newData: any;
  oldData: any;
  diffLense: DiffLens;
}

export class EveesDiff extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ type: String, attribute: 'root-perspective' })
  rootPerspective!: string;

  @property({ type: Boolean })
  summary = false;

  @property({ attribute: false })
  loading: boolean = true;

  updatesDetails: Map<string, UpdateDetails> = new Map();

  /** the evees service can be set from a parent component*/
  localEvees!: Evees;

  protected recognizer!: PatternRecognizer;

  async firstUpdated() {
    this.logger.log('firstUpdated()');
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
    if (!this.localEvees) {
      this.localEvees = this.evees;
    }

    this.loading = true;

    const mutation = await this.evees.client.diff();

    const getDetails = mutation.updates
      .filter((u) => !!u.details.headId)
      .map(async (update) => {
        if (!update.details.headId) throw new Error('newHead undefined');

        const newData = await this.evees.getCommitData(update.details.headId);

        const oldData =
          update.oldDetails && update.oldDetails.headId !== undefined
            ? await this.evees.getCommitData(update.oldDetails.headId)
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
      const newRoot = mutation.newPerspectives.find(
        (newPerspective) => newPerspective.perspective.id === this.rootPerspective
      );
      if (newRoot) {
        if (newRoot.update.details.headId) {
          const newData = await this.evees.getCommitData(newRoot.update.details.headId);

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
        ${details.diffLense.render(this.evees, details.newData, details.oldData, this.summary)}
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
