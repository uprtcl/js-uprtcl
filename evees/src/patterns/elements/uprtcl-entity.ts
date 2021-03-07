import { LitElement, property, html, css, internalProperty } from 'lit-element';
import { Evees } from 'src/evees/evees.service.js';

import { servicesConnect } from '../../container/multi-connect.mixin.js';
import { Logger } from '../../utils/logger.js';
import { Lens } from '../behaviours/has-lenses.js';

export interface RenderEntityInput {
  uref: string;
  readOnly?: boolean;
}

export class UprtclEntity extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-AUTHOR');

  @property({ type: String })
  uref!: string;

  @property({ type: Boolean, attribute: 'read-only' })
  readOnly!: boolean;

  @internalProperty()
  loading = true;

  localEvees!: Evees;

  lense!: Lens<RenderEntityInput>;

  async firstUpdated() {
    if (!this.localEvees) {
      this.localEvees = this.evees;
    }

    this.load();
  }

  async load() {
    this.loading = true;
    const lenses = await this.localEvees.perspectiveBehaviorFirst(this.uref, 'lenses');
    this.lense = lenses[0];
    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html`<uprtcl-loading></uprtcl-loading>`;
    }

    return html`${this.lense.render({ uref: this.uref, readOnly: this.readOnly }, this.localEvees)}`;
  }

  static get styles() {
    return css``;
  }
}
