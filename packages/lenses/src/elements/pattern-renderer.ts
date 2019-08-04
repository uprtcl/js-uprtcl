import { html, LitElement, property } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { connect } from 'pwa-helpers/connect-mixin';
import { Store } from 'redux';

import { loadObject } from '../../../common/src/redux/objects.actions';
import { Source } from '../../../core/src/services';
import { selectObjects, selectById } from '../../../common/src/redux/objects.selectors';
import PatternRegistry from '../../../core/src/patterns/registry/pattern.registry';
import { LensesPattern } from '../patterns/lenses.pattern';
import { Lens, MenuItem } from '../types';
import { MenuPattern } from '../patterns/menu.pattern';
import { RenderPattern } from '../../../core/src/patterns/patterns/render.pattern';

export function PatternRenderer<T>(
  patternRegistry: PatternRegistry,
  source: Source,
  store: Store<T>
) {
  class PatternRenderer extends connect(store)(LitElement) {
    @property()
    public hash: string;
    @property()
    private object: object;

    // Lenses
    private lenses: Lens[];
    private selectedLensIndex: number = 0;

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
            .object=${this.object}
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
        ${this.object
          ? html`
              Loading...
            `
          : html`
              ${this.renderLens()} ${this.renderLensSelector()} ${this.renderMenu()}
            `}
      `;
    }

    firstUpdated() {
      // TODO: type redux store
      store.dispatch(loadObject(source)(this.hash) as any);
    }

    stateChanged(state: T) {
      const objects = selectObjects(state);
      const object = selectById(objects)(this.hash);

      if (object) {
        const pattern: LensesPattern & MenuPattern & RenderPattern<any> = patternRegistry.from(
          object
        );
        if (pattern.hasOwnProperty('getLenses')) {
          // Reverse the lenses to maintain last lens priority
          this.lenses = pattern.getLenses().reverse();
        }

        if (pattern.hasOwnProperty('getMenuItems')) {
          this.menuItems = pattern.getMenuItems();
        }

        if (pattern.hasOwnProperty('render')) {
          pattern.render(this.object).then(renderObject => (this.object = renderObject));
        } else {
          this.object = object;
        }
      }
    }

  }

  return PatternRenderer;
}
