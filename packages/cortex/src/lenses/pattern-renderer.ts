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
import { Pattern } from '../patterns/pattern';

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
    private selectedLensIndex: [number, number] = [0, 0];
    private lenses: Lens[][];

    // Menu items
    @property({ type: Array })
    private menuItems: MenuItem[][];

    /**
     * @returns the rendered selected lens
     */
    renderLens() {
      const selectedLens = this.lenses[this.selectedLensIndex[0]][this.selectedLensIndex[1]];
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
                ${this.lenses.map((lensGroup, i) =>
                  lensGroup.map(
                    (lens, j) =>
                      shtml`
                        <option value=${lens.lens} @click=${() =>
                        (this.selectedLensIndex = [i, j])}>
                          ${lens.lens}
                        </option>
                      `
                  )
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
              <div style="display: flex; flex-direction: row;">
                <div style="flex: 1;">
                  ${this.renderLens()}
                </div>

                ${this.renderLensSelector()}
                ${this.renderMenu()}
              </div>
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
        const patterns: Array<Pattern | LensesPattern | MenuPattern> = patternRegistry.recognize(
          entity
        );

        const lenses = [];
        const menuItems = [];

        for (const pattern of patterns) {
          if ((pattern as LensesPattern).getLenses) {
            lenses.push((pattern as LensesPattern).getLenses());
          }

          if ((pattern as MenuPattern).getMenuItems) {
            menuItems.push((pattern as MenuPattern).getMenuItems(entity));
          }
        }

        // Reverse the lenses and menuItems to maintain last pattern priority
        this.lenses = lenses.reverse();
        this.menuItems = menuItems.reverse();

        const pattern: RenderPattern<any> = patternRegistry.recognizeMerge(entity);

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
