import { html } from 'lit-element';
import '@authentic/mwc-circular-progress';

import { CortexEntityBase } from './cortex-entity-base';
import { sharedStyles } from '../shared-styles';

export class CortexEntity extends CortexEntityBase {
  static get styles() {
    return sharedStyles;
  }

  renderSlotPlugins() {
    return html`
      <div slot="plugins" class="row center-content">
        ${Object.keys(this.slotPlugins).map(
          key => this.entity && this.slotPlugins[key].renderSlot(this.entity)
        )}
      </div>
      ${Object.keys(this.slotPlugins).map(
        key =>
          this.entity &&
          html`
            <div slot=${key}>${this.slotPlugins[key].renderSlot(this.entity)}</div>
          `
      )}
    `;
  }

  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    if (!this.selectedLens) return html``;

    const lens =  html`
      <div id="lens-element">${this.selectedLens.render(this.renderSlotPlugins())}</div>
    `;

    return this.renderLensPlugins(lens);
  }

  renderLoadingPlaceholder() {
    return html`
      <mwc-circular-progress></mwc-circular-progress>
    `;
  }


  render() {
    return html`
      ${!this.selectedLens
        ? this.renderLoadingPlaceholder()
        : html`
            <div class="row center-content">
              <div style="flex: 1;">
                ${this.renderLens()}
              </div>
            </div>
          `}
    `;
  }
}
