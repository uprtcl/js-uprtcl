import { LitElement, property, PropertyValues } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import {
  Isomorphism,
  Lens,
  PatternAction,
  SelectedLens,
  PatternTypes,
  LensElement
} from '../../types';
import { Pattern } from '../../patterns/pattern';
import { HasLenses } from '../../patterns/properties/has-lenses';
import { HasActions } from '../../patterns/properties/has-actions';
import { Transformable } from '../../patterns/properties/transformable';
import { HasRedirect } from '../../patterns/properties/has-redirect';
import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';

export class CortexEntityBase extends moduleConnect(LitElement) {
  @property()
  public hash!: string;
  @property()
  protected entity!: object;

  @property()
  protected isomorphisms!: Array<Isomorphism>;

  @property()
  protected entityEditable: boolean = false;

  // Lenses
  @property()
  protected selectedLens!: SelectedLens | undefined;

  protected patternRecognizer!: PatternRecognizer;

  loadEntity(hash: string): Promise<any> {
    throw new Error('Method not implemented');
  }
  getLensElement(): HTMLElement | null {
    return null;
  }

  connectedCallback() {
    super.connectedCallback();

    this.patternRecognizer = this.request(PatternTypes.Recognizer);
  }

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.entity = await this.loadEntity(this.hash);
    await this.entityUpdated();
  }

  update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    const renderer = this.getLensElement();
    if (renderer && this.selectedLens) {
      if (renderer) {
        const selectedIsomorphism = this.isomorphisms[this.selectedLens.isomorphism];
        const lensElement = (renderer as unknown) as LensElement<any>;
        lensElement.data = selectedIsomorphism.entity;

        lensElement.editable = this.entityEditable;
      }
    }
  }

  async entityUpdated() {
    const isomorphisms = await this.loadIsomorphisms(this.entity);
    this.isomorphisms = isomorphisms.reverse();

    const renderIsomorphism = this.isomorphisms.findIndex(i => i.lenses.length > 0);
    if (renderIsomorphism !== -1) {
      this.selectedLens = { isomorphism: renderIsomorphism, lens: 0 };
    }
  }

  async loadIsomorphisms(entity: any): Promise<Isomorphism[]> {
    let isomorphisms: Isomorphism[] = [];

    isomorphisms.push(this.buildIsomorphism(entity));

    const transformIsomorphisms = this.transformEntity(entity);
    isomorphisms = isomorphisms.concat(transformIsomorphisms);

    // Recursive call to get all isomorphisms from redirected entities
    const redirectedIsomorphisms = await this.redirectEntity(entity);
    isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
    return isomorphisms;
  }

  async redirectEntity(entity: object): Promise<Array<Isomorphism>> {
    const patterns: Array<Pattern | HasRedirect> = this.patternRecognizer.recognize(entity);

    let isomorphisms: Isomorphism[] = [];

    for (const pattern of patterns) {
      if ((pattern as HasRedirect).redirect) {
        const redirectHash = await (pattern as HasRedirect).redirect(entity);

        if (redirectHash) {
          const redirectEntity = await this.loadEntity(redirectHash);
          const redirectedIsomorphisms = await this.loadIsomorphisms(redirectEntity);

          isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
        }
      }
    }

    return isomorphisms;
  }

  transformEntity<T extends object>(entity: T): Array<Isomorphism> {
    const patterns: Array<Pattern | Transformable<any>> = this.patternRecognizer.recognize(entity);

    let isomorphisms: Array<Isomorphism> = [];

    for (const pattern of patterns) {
      if ((pattern as Transformable<any>).transform) {
        const transformedEntities: Array<any> = (pattern as Transformable<any>).transform(entity);

        isomorphisms = isomorphisms.concat(
          transformedEntities.map(entity => this.buildIsomorphism(entity))
        );
      }
    }

    return isomorphisms;
  }

  buildIsomorphism<T extends object>(entity: T): Isomorphism {
    const patterns: Array<Pattern | HasLenses | HasActions> = this.patternRecognizer.recognize(
      entity
    );

    let actions: PatternAction[] = [];
    let lenses: Lens[] = [];

    for (const pattern of patterns) {
      if ((pattern as HasLenses).getLenses) {
        lenses = lenses.concat((pattern as HasLenses).getLenses(entity));
      }

      if ((pattern as HasActions).getActions) {
        actions = actions.concat((pattern as HasActions).getActions(entity));
      }
    }

    return {
      entity,
      actions,
      lenses
    };
  }
}
