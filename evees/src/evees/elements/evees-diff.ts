import { LitElement, property, html, css } from 'lit-element';

import { Logger } from '../../utils/logger';
import { servicesConnect } from '../../container/multi-connect.mixin';

import { Update, DiffLens } from '../interfaces/types';
import { Evees } from '../evees.service';

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

  async firstUpdated() {
    this.logger.log('firstUpdated()');
    this.loadUpdates();
  }

  async updated(changedProperties) {
    this.logger.log('updated()', changedProperties);

    if (changedProperties.has('rootPerspective')) {
      this.loadUpdates();
    }
  }

  async loadUpdates() {
    if (!this.localEvees) {
      return;
    }

    this.loading = true;

    const mutation = await this.localEvees.client.diff();

    const updates = mutation.updates.filter((u) => !!u.details.headId);

    /** how the new perspective as a change if is the rootPerspective */
    if (this.rootPerspective) {
      updates.push(
        ...mutation.newPerspectives
          .filter((np) => np.perspective.id === this.rootPerspective)
          .map((np) => np.update)
      );
    }

    const getDetails = updates.map(async (update) => {
      if (!update.details.headId) throw new Error('newHead undefined');

      const newData = await this.localEvees.getCommitData(update.details.headId);

      const oldData =
        update.oldDetails && update.oldDetails.headId !== undefined
          ? await this.localEvees.getCommitData(update.oldDetails.headId)
          : undefined;

      const diffLenses = this.localEvees.behaviorFirst(newData.object, 'diffLenses');

      this.updatesDetails[update.perspectiveId] = {
        diffLense: diffLenses[0],
        update,
        oldData,
        newData,
      };
    });

    await Promise.all(getDetails);

    this.loading = false;
  }

  renderUpdateDiff(details: UpdateDetails) {
    // TODO: review if old data needs to be
    return html`
      <div class="evee-diff">
        ${details.diffLense.render(
          this.localEvees,
          details.newData.object,
          details.oldData ? details.oldData.object : undefined,
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
