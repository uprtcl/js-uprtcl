import { LitElement, property, html, css, internalProperty } from 'lit-element';

import { Logger } from '../../utils/logger';
import { servicesConnect } from '../../container/multi-connect.mixin';

import { Evees } from '../evees.service';
import { UpdateDetails } from '../interfaces/types';

const LOGINFO = true;

export class EveesDiff extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ type: String, attribute: 'perspective-id' })
  rootPerspective: string | undefined;

  @property({ type: Boolean })
  summary = false;

  @internalProperty()
  loading: boolean = true;

  @internalProperty()
  updateDetails!: UpdateDetails[];

  /** the evees service can be set from a parent component*/
  localEvees!: Evees;

  async firstUpdated() {
    this.logger.log('firstUpdated()');
    this.loadUpdates();
  }

  async updated(changedProperties) {
    if (changedProperties.has('rootPerspective')) {
      this.loadUpdates();
    }
  }

  async loadUpdates() {
    if (!this.localEvees) {
      return;
    }

    if (!this.rootPerspective) {
      throw new Error('rootPerspective undefined');
    }

    this.loading = true;
    this.updateDetails = await this.evees.exploreDiffUnder(this.rootPerspective, this.localEvees);
    this.loading = false;
  }

  renderUpdateDiff(details: UpdateDetails) {
    const lenses = this.evees.behaviorFirst(details.newData.object, 'diffLenses');
    return html`
      <div class="evee-diff">
        ${lenses[0].render(
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

    return this.updateDetails.length === 0
      ? html` <span><i>no changes found</i></span> `
      : this.updateDetails.map((updateDetails) => this.renderUpdateDiff(updateDetails));
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
