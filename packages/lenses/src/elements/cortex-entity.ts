import { html } from 'lit-element';
import '@authentic/mwc-circular-progress';
import '@material/mwc-button';
import '@authentic/mwc-icon';
import '@authentic/mwc-list';
import '@authentic/mwc-menu';

import { CortexEntityBase } from './cortex-entity-base';

export class CortexEntity extends CortexEntityBase {
  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    if (!this.selectedLens || !this.isomorphisms) return html``;

    return html`
      <div id="lens-renderer">
        ${this.selectedLens.render}
      </div>
    `;
  }

  getLensElement(): Element | null {
    const element = this.shadowRoot ? this.shadowRoot.getElementById('lens-renderer') : null;
    if (!element) return null;

    return element.firstElementChild;
  }

  render() {
    return html`
      ${!this.isomorphisms || !this.selectedLens
        ? html`
            <mwc-circular-progress></mwc-circular-progress>
          `
        : html`
            <div style="display: flex; flex-direction: row;">
              <div style="flex: 1;">
                ${this.renderLens()}
              </div>

              ${this.renderPlugins().map(
                plugin =>
                  html`
                    ${plugin}
                  `
              )}
            </div>
          `}
    `;
  }
}
