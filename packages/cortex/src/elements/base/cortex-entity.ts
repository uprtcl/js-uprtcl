import { html, LitElement, property, PropertyValues } from 'lit-element';
import { Store } from 'redux';
import '@authentic/mwc-circular-progress';
import '@material/mwc-button';
import '@authentic/mwc-icon';
import '@authentic/mwc-list';
import '@authentic/mwc-menu';

import { moduleConnect, ReduxTypes } from '@uprtcl/micro-orchestrator';

import {
  Lens,
  PatternAction,
  LensElement,
  Isomorphism,
  SelectedLens,
  PatternTypes,
  DiscoveryTypes
} from '../../types';
import { loadEntity, selectEntities, selectById } from '../../entities';
import { LensesPattern } from '../../patterns/patterns/lenses.pattern';
import { ActionsPattern } from '../../patterns/patterns/actions.pattern';
import { RedirectPattern } from '../../patterns/patterns/redirect.pattern';
import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';
import { Pattern } from '../../patterns/pattern';
import { UpdatePattern } from '../../patterns/patterns/update.pattern';
import { TransformPattern } from '../../patterns/patterns/transform.pattern';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { Source } from '../../services/sources/source';

export class CortexEntity extends moduleConnect(LitElement) {
  @property()
  public hash!: string;
  @property()
  private entity!: object;

  @property()
  private isomorphisms!: Array<Isomorphism>;

  // Lenses
  @property()
  private selectedLens!: SelectedLens | undefined;

  @property()
  private actionsMenuOpen: boolean = false;

  private store!: Store<any>;
  private source!: Source;
  private patternRecognizer!: PatternRecognizer;

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
    this.patternRecognizer = this.request(PatternTypes.Recognizer);

    this.addEventListener<any>('content-changed', (e: CustomEvent) => {
      e.stopPropagation();
      this.updateContent(e.detail.newContent);
    });
    this.store.subscribe(() => this.stateChanged(this.store.getState()));
  }

  update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (this.shadowRoot && this.selectedLens) {
      const renderer = this.shadowRoot.getElementById('lens-renderer');

      if (renderer) {
        const selectedIsomorphism = this.isomorphisms[this.selectedLens.isomorphism];
        ((renderer as unknown) as LensElement<any>).data = selectedIsomorphism.entity;
      }
    }
  }

  async updateContent(newContent: any) {
    const updatePattern: UpdatePattern = this.patternRecognizer.recognizeMerge(this.entity);

    if (updatePattern.update) {
      this.selectedLens = undefined;
      const reloadNeeded = await updatePattern.update(this.entity, newContent);

      if (reloadNeeded) await this.buildEntityIsomorphisms();
    }
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

  firstUpdated() {
    this.loadEntity(this.hash);
  }

  loadEntity(hash: string): Promise<any> {
    // TODO: type redux store
    return this.store.dispatch(loadEntity(this.source)(hash) as any);
  }

  stateChanged(state: any) {
    const entities = selectEntities(state);
    const entity = selectById(this.hash)(entities);

    if (entity && !this.entity) {
      this.entity = entity;
      this.buildEntityIsomorphisms();
    }
  }

  async buildEntityIsomorphisms() {
    let isomorphisms: Isomorphism[] = [];

    // Build first isomorphism: the proper entity
    isomorphisms.push(this.buildIsomorphism(this.entity));

    // Transform the entity to build its isomorphisms
    isomorphisms = isomorphisms.concat(this.transformEntity(this.entity));

    // Redirect the entity
    await this.redirectEntity(this.entity).then(i => {
      isomorphisms = isomorphisms.concat(i);
      this.isomorphisms = isomorphisms.reverse();

      const renderIsomorphism = this.isomorphisms.findIndex(i => i.lenses.length > 0);
      if (renderIsomorphism !== -1) {
        this.selectedLens = { isomorphism: renderIsomorphism, lens: 0 };
      }
    });
  }

  async redirectEntity(entity: object): Promise<Array<Isomorphism>> {
    const patterns: Array<Pattern | RedirectPattern<any>> = this.patternRecognizer.recognize(
      entity
    );

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
    const patterns: Array<
      Pattern | LensesPattern | ActionsPattern
    > = this.patternRecognizer.recognize(entity);

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
    const patterns: Array<Pattern | TransformPattern<T, any>> = this.patternRecognizer.recognize(
      entity
    );

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
