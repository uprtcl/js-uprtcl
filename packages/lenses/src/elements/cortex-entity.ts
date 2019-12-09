import { html } from 'lit-element';
import '@authentic/mwc-circular-progress';

import { CortexEntityBase } from './cortex-entity-base';

export class CortexEntity extends CortexEntityBase {
  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    if (!this.selectedLens) return html``;

    return html`
      <div id="lens-renderer">
        ${this.selectedLens.render(
          html`
            <div slot="plugins" style="display: flex; flex-direction: row;">
              ${this.renderPlugins().map(
                plugin =>
                  html`
                    ${plugin}
                  `
              )}
            </div>
          `
        )}
      </div>
    `;
  }

  getLensElement(): Element | null {
    const element = this.shadowRoot ? this.shadowRoot.getElementById('lens-renderer') : null;
    if (!element) return null;

    window['lenselement'] = element.firstElementChild;

    return element.firstElementChild;
  }

  render() {
    return html`
      ${!this.selectedLens
        ? html`
            <mwc-circular-progress></mwc-circular-progress>
          `
        : html`
            <div style="display: flex; flex-direction: row; position: relative;">
              <div style="flex: 1;">
                ${this.renderLens()}
              </div>
            </div>
          `}
    `;
  }
}
