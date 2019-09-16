import { html, LitElement, property } from 'lit-element';
import withCustomElement, {
  unsafeStatic
} from '@corpuscule/lit-html-renderer/lib/withCustomElement';
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

const shtml = withCustomElement(html);

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
    @property({ type: Array })
    private menuItems: MenuItem[][];

    /**
     * @returns the rendered selected lens
     */
    renderLens() {
      const selectedLens = this.lenses[this.selectedLensIndex];
      const paramKeys = Object.keys(selectedLens.params);

      const Lens = unsafeStatic(selectedLens.lens);

      /**
       * TODO: add parameters to the lens
       *
       *  ${paramKeys.map(
       *     param =>
       *       shtml`
       *         ${param}="${selectedLens.params[param]}"
       *       `
       *   )}
       */

      return shtml`
        <${Lens} .data=${this.entity}>
        </${Lens}>`;
    }

    renderLensSelector() {
      return shtml`
        ${
          this.lenses
            ? shtml`
              <select>
                ${this.lenses.map(
                  (lens, index) =>
                    shtml`
                      <option value=${lens.lens} @click=${() => (this.selectedLensIndex = index)}>
                        ${lens.lens}
                      </option>
                    `
                )}
              </select>
            `
            : shtml``
        }
      `;
    }

    renderMenu() {
      return shtml`
        ${
          this.menuItems
            ? this.menuItems.map(
                itemGroup =>
                  shtml`
                  ${itemGroup.map(
                    item =>
                      shtml`
                        <button @click=${() => item.action()}>${item.title}</button>
                      `
                  )}
                `
              )
            : shtml``
        }
      `;
    }

    render() {
      return shtml`
        ${
          !this.entity
            ? shtml`
              <mwc-linear-progress></mwc-linear-progress>
            `
            : shtml`
              ${this.renderLens()} ${this.renderLensSelector()} ${this.renderMenu()}
            `
        }
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
        console.log(pattern);
        if (pattern.getLenses) {
          // Reverse the lenses to maintain last lens priority
          this.lenses = pattern.getLenses().reverse();
        }

        if (pattern.getMenuItems) {
          this.menuItems = pattern.getMenuItems(entity);
        }

        if (pattern.render) {
          pattern.render(this.entity).then(renderEntity => (this.entity = renderEntity));
        } else {
          this.entity = entity;
        }
      }
    }
  }

  return PatternRenderer;
}
