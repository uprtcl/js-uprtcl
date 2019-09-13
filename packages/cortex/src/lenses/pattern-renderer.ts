import { html, LitElement, property } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { Store } from 'redux';
import '@material/mwc-linear-progress';

import { Lens, MenuItem } from '../types';
import { loadEntity, selectEntities, selectById } from '../entities';
import { LensesPattern } from '../patterns/patterns/lenses.pattern';
import { MenuPattern } from '../patterns/patterns/menu.pattern';
import { RenderPattern } from '../patterns/patterns/render.pattern';
import { PatternRegistry } from '../patterns/registry/pattern.registry';
import { Source } from '../services/sources/source';

export function PatternRenderer<T>(
  patternRegistry: PatternRegistry,
  source: Source,
  store: Store<T>
): typeof HTMLElement {
  class PatternRenderer extends connect(store)(LitElement) {
    @property()
    public hash: string;
    @property()
    private entity: object;

    // Lenses
    @property()
    private selectedLensIndex: number = 0;
    private lenses: Lens[];

    // Menu items
    private menuItems: MenuItem[][];

    /**
     * @returns the rendered selected lens
     */
    renderLens() {
      const selectedLens = this.lenses[this.selectedLensIndex];
      const paramKeys = Object.keys(selectedLens.params);
      return html`
        ${unsafeHTML(
          `<${selectedLens.lens}
            ${paramKeys.map(
              param =>
                html`
                  ${param}="${selectedLens.params[param]}"
                `
            )}
            .data=${this.entity}
          ></${selectedLens.lens}>`
        )}
      `;
    }

    renderLensSelector() {
      return html`
        ${this.lenses
          ? html`
              <select>
                ${this.lenses.map(
                  (lens, index) =>
                    html`
                      <option value=${lens.lens} @click=${() => (this.selectedLensIndex = index)}>
                        ${lens.lens}
                      </option>
                    `
                )}
              </select>
            `
          : html``}
      `;
    }

    renderMenu() {
      return html`
        ${this.menuItems
          ? this.menuItems.map(
              itemGroup =>
                html`
                  ${itemGroup.map(
                    item =>
                      html`
                        <button @click=${() => item.action()}>${item.title}</button>
                      `
                  )}
                `
            )
          : html``}
      `;
    }

    render() {
      return html`
        ${!this.entity
          ? html`
              <mwc-linear-progress></mwc-linear-progress>
            `
          : html`
              ${this.renderLens()} ${this.renderLensSelector()} ${this.renderMenu()}
            `}
      `;
    }

    firstUpdated() {
      // TODO: type redux store
      store.dispatch(loadEntity(source)(this.hash) as any);
    }

    stateChanged(state: T) {
      const entities = selectEntities(state);
      const entity = selectById(this.hash)(entities);

      if (entity) {
        const pattern: LensesPattern & MenuPattern & RenderPattern<any> = patternRegistry.from(
          entity
        );
        if (pattern.hasOwnProperty('getLenses')) {
          // Reverse the lenses to maintain last lens priority
          this.lenses = pattern.getLenses().reverse();
        }

        if (pattern.hasOwnProperty('getMenuItems')) {
          this.menuItems = pattern.getMenuItems();
        }

        if (pattern.hasOwnProperty('render')) {
          pattern.render(this.entity).then(renderEntity => (this.entity = renderEntity));
        } else {
          this.entity = entity;
        }
      }
    }
  }

  return PatternRenderer;
}
