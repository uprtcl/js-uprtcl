import { LitElement, property, html, css, internalProperty } from 'lit-element';

import { Logger } from '../../utils/logger';
import { servicesConnect } from '../../container/multi-connect.mixin';

import { Evees } from '../evees.service';
import { UpdateDetails } from '../interfaces/types';

const LOGINFO = true;

export class EveesDiffExplorer extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ type: String, attribute: 'perspective-id' })
  rootPerspective: string | undefined;

  @property({ type: Boolean })
  summary = false;

  @internalProperty()
  loading: boolean = true;

  @internalProperty()
  updateDetailsList!: UpdateDetails[];

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

    /** review the entire rootPerspective ecoystem, order the updates and prefetch the data objects. */
    this.updateDetailsList = await this.localEvees.exploreDiffUnder(
      this.rootPerspective,
      this.localEvees
    );

    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    return this.updateDetailsList.length === 0
      ? html` <span><i>no changes found</i></span> `
      : this.updateDetailsList.map(
          (updateDetails) =>
            html`<evees-diff-update
              .updateDetails=${updateDetails}
              .localEvees=${this.localEvees}
            ></evees-diff-update>`
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
