import { html, property } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
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
  @property()
  private actionsMenuOpen: boolean = false;

  private store!: Store<any>;
  private source!: Source;

  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    if (!this.selectedLens) return html``;

    const selectedIsomorphism = this.isomorphisms[this.selectedLens.isomorphism];
    const selectedLens = selectedIsomorphism.lenses[this.selectedLens.lens];
    const paramKeys = Object.keys(selectedLens.params);

    /**
     * TODO: add parameters to the lens
     *
     *  ${paramKeys.map(
     *     param =>
     *       html`
     *         ${param}="${selectedLens.params[param]}"
     *       `
     *   )}
     */

    return html`
      ${unsafeHTML(`
          <${selectedLens.lens} id="lens-renderer">
          </${selectedLens.lens}>
      `)}
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    this.store = this.request(ReduxTypes.Store);
    this.source = this.request(DiscoveryTypes.DiscoveryService);
  }

  getLensElement(): HTMLElement | null {
    return this.shadowRoot ? this.shadowRoot.getElementById('lens-renderer') : null;
  }

  renderActions() {
    return html`
      <mwc-button @click=${() => (this.actionsMenuOpen = !this.actionsMenuOpen)}>
        <mwc-icon>more_vert</mwc-icon>
      </mwc-button>

      <mwc-menu ?open=${this.actionsMenuOpen}>
        <mwc-list>
          ${this.isomorphisms.map(isomorphism =>
            isomorphism.actions.map(
              action =>
                html`
                  <mwc-list-item @click=${() => action.action(this)}>
                    <mwc-icon slot="graphic">${action.icon}</mwc-icon>
                    ${action.title}
                  </mwc-list-item>
                `
            )
          )}
        </mwc-list>
      </mwc-menu>
    `;
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

              <lens-selector
                .isomorphisms=${this.isomorphisms}
                @lens-selected=${(e: CustomEvent) => (this.selectedLens = e.detail.selectedLens)}
              ></lens-selector>
              ${this.renderActions()}
            </div>
          `}
    `;
  }

  loadEntity(hash: string): Promise<any> {
    // TODO: type redux store
    return this.store.dispatch(loadEntity(this.source)(hash) as any);
  }
}
