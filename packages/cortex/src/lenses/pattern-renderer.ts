import { html, LitElement, property } from 'lit-element';
import withCustomElement, {
  unsafeStatic
} from '@corpuscule/lit-html-renderer/lib/withCustomElement';
import { connect } from 'pwa-helpers/connect-mixin';
import { Store } from 'redux';
import '@material/mwc-linear-progress';

import { Lens, PatternAction } from '../types';
import { loadEntity, selectEntities, selectById } from '../entities';
import { LensesPattern } from '../patterns/patterns/lenses.pattern';
import { ActionsPattern } from '../patterns/patterns/actions.pattern';
import { RedirectPattern } from '../patterns/patterns/redirect.pattern';
import { PatternRegistry } from '../patterns/registry/pattern.registry';
import { Source } from '../services/sources/source';
import { Pattern } from '../patterns/pattern';
import { UpdatePattern } from '../patterns/patterns/update.pattern';
import { TransformPattern } from '../patterns/patterns/transform.pattern';

interface Isomorphism {
  entity: object;
  lenses: Lens[];
  actions: PatternAction[];
}

const shtml = withCustomElement(html);

export function PatternRenderer<T>(
  patternRegistry: PatternRegistry,
  source: Source,
  store: Store<T>
): typeof HTMLElement {
  class PatternRenderer extends connect(store)(LitElement) {
    @property()
    public hash!: string;
    @property()
    private entity!: object;

    @property()
    private isomorphisms!: Array<Isomorphism>;

    // Lenses
    @property()
    private selectedLensIndex!: [number, number];

    /**
     * @returns the rendered selected lens
     */
    renderLens() {
      const selectedIsomorphism = this.isomorphisms[this.selectedLensIndex[0]];
      const selectedLens = selectedIsomorphism.lenses[this.selectedLensIndex[1]];
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
        <${Lens}
          .data=${selectedIsomorphism.entity}
          @content-changed=${(e: CustomEvent) => this.updateContent(e.detail.newContent)}
        >
        </${Lens}>`;
    }

    updateContent(newContent: any) {
      const updatePattern: UpdatePattern = patternRegistry.recognizeMerge(this.entity);

      if (updatePattern.update) {
        updatePattern.update(this.entity, newContent);
      }
    }

    renderLensSelector() {
      return shtml`
              <select>
                ${this.isomorphisms.map((isomorphism, i) =>
                  isomorphism.lenses.map(
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
      `;
    }

    renderActions() {
      return shtml`
        ${this.isomorphisms.map(
          isomorphism =>
            shtml`
                  ${isomorphism.actions.map(
                    action =>
                      shtml`
                        <button @click=${() => action.action()}>${action.title}</button>
                      `
                  )}
                `
        )}
      `;
    }

    render() {
      return shtml`
        ${
          !this.entity || !this.selectedLensIndex
            ? shtml`
              <mwc-linear-progress></mwc-linear-progress>
            `
            : shtml`
              <div style="display: flex; flex-direction: row;">
                <div style="flex: 1;">
                  ${this.renderLens()}
                </div>

                ${this.renderLensSelector()}
                ${this.renderActions()}
              </div>
            `
        }
      `;
    }

    firstUpdated() {
      this.loadEntity(this.hash);
    }

    loadEntity(hash: string): Promise<any> {
      // TODO: type redux store
      return store.dispatch(loadEntity(source)(hash) as any);
    }

    stateChanged(state: T) {
      const entities = selectEntities(state);
      const entity = selectById(this.hash)(entities);

      if (entity && !this.entity) {
        this.entity = entity;
        this.isomorphisms = [];

        // Build first isomorphism: the proper entity
        this.isomorphisms.push(this.buildIsomorphism(entity));

        // Transform the entity to build its isomorphisms
        this.isomorphisms = this.isomorphisms.concat(this.transformEntity(entity));

        // Redirect the entity
        this.redirectEntity(entity).then(i => {
          this.isomorphisms = this.isomorphisms.concat(i);
          const renderIsomorphism = this.isomorphisms.findIndex(i => i.lenses.length > 0);
          this.selectedLensIndex = [renderIsomorphism, 0];
        });
      }
    }

    async redirectEntity(entity: object): Promise<Array<Isomorphism>> {
      const patterns: Array<Pattern | RedirectPattern<any>> = patternRegistry.recognize(entity);

      let isomorphisms: Isomorphism[] = [];

      for (const pattern of patterns) {
        if ((pattern as RedirectPattern<any>).redirect) {
          const redirectHash = await (pattern as RedirectPattern<any>).redirect(entity);

          if (redirectHash) {
            const redirectEntity = await this.loadEntity(redirectHash);

            isomorphisms.push(this.buildIsomorphism(redirectEntity));

            const transformIsomorphisms = this.transformEntity(redirectEntity);
            isomorphisms = isomorphisms.concat(transformIsomorphisms);

            // Recursive call to get all isomorphisms from redirected entities
            const redirectedIsomorphisms = await this.redirectEntity(redirectEntity);
            isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
          }
        }
      }

      return isomorphisms;
    }

    buildIsomorphism<T extends object>(entity: T): Isomorphism {
      const patterns: Array<Pattern | LensesPattern | ActionsPattern> = patternRegistry.recognize(
        entity
      );

      let actions: PatternAction[] = [];
      let lenses: Lens[] = [];

      for (const pattern of patterns) {
        if ((pattern as LensesPattern).getLenses) {
          lenses = lenses.concat((pattern as LensesPattern).getLenses(entity));
        }

        if ((pattern as ActionsPattern).getActions) {
          actions = actions.concat((pattern as ActionsPattern).getActions(entity));
        }
      }

      return {
        entity,
        actions,
        lenses
      };
    }

    transformEntity<T extends object>(entity: T): Array<Isomorphism> {
      const patterns: Array<Pattern | TransformPattern<T, any>> = patternRegistry.recognize(entity);

      let isomorphisms: Array<Isomorphism> = [];

      for (const pattern of patterns) {
        if ((pattern as TransformPattern<any, any>).transform) {
          const transformedEntities: Array<any> = (pattern as TransformPattern<T, any>).transform(
            entity
          );

          isomorphisms = isomorphisms.concat(
            transformedEntities.map(entity => this.buildIsomorphism(entity))
          );
        }
      }

      return isomorphisms;
    }
  }

  return PatternRenderer;
}
