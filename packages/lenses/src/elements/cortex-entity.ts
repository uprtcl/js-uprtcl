import { html } from 'lit-element';
import '@authentic/mwc-circular-progress';

import { CortexEntityBase } from './cortex-entity-base';
import { sharedStyles } from '../shared-styles';

export class CortexEntity extends CortexEntityBase {
  static get styles() {
    return sharedStyles;
  }

  renderPlugins() {
    return html`
      <div slot="plugins" class="row center-content">
        ${Object.keys(this.plugins).map(
          key => this.entity && this.plugins[key].render(this.entity)
        )}
      </div>
      ${Object.keys(this.plugins).map(
        key =>
          this.entity &&
          html`
            <div slot=${key}>${this.plugins[key].render(this.entity)}</div>
          `
      )}
    `;
  }

  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    if (!this.selectedLens) return html``;

    return this.selectedLens.render(this.renderPlugins());
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
