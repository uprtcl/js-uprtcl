import { html } from 'lit-element';
import '@authentic/mwc-circular-progress';
import '@material/mwc-button';
import '@authentic/mwc-icon';
import '@authentic/mwc-list';
import '@authentic/mwc-menu';

import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { LoadEntity, LOAD_ENTITY, selectById, selectEntities } from '@uprtcl/common';

import { CortexEntityBase } from './cortex-entity-base';
import { Dictionary } from 'lodash';

export class CortexEntity extends reduxConnect(CortexEntityBase) {
  entities: Dictionary<any> = {};

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

  stateChanged(state: any) {
    this.entities = selectEntities(state).entities;
    this.entity = selectById(this.hash)(selectEntities(state));

    this.entityUpdated();
  }

  selectEntity(hash: string) {
    return this.entities[hash];
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

  async loadEntity(hash: string): Promise<any> {
    const action: LoadEntity = {
      type: LOAD_ENTITY,
      payload: { hash }
    };
    this.store.dispatch(action);
  }
}
