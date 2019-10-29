import { html } from 'lit-element';
import { Store } from 'redux';
import '@authentic/mwc-circular-progress';
import '@material/mwc-button';
import '@authentic/mwc-icon';
import '@authentic/mwc-list';
import '@authentic/mwc-menu';

import { ReduxTypes } from '@uprtcl/micro-orchestrator';

import { DiscoveryTypes } from '../../types';
import { loadEntity } from '../../entities';
import { Source } from '../../services/sources/source';
import { CortexEntityBase } from './cortex-entity-base';

export class CortexEntity extends CortexEntityBase {
  private get store(): Store<any> {
    return this.request(ReduxTypes.Store);
  }
  private get source(): Source {
    return this.request(DiscoveryTypes.DiscoveryService);
  }

  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    if (!this.selectedLens) return html``;

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
      ${!this.entity || !this.selectedLens
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

  loadEntity(hash: string): Promise<any> {
    // TODO: type redux store
    return this.store.dispatch(loadEntity(this.source)(hash) as any);
  }
}
