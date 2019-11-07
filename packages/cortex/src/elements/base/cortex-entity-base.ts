import { LitElement, property, PropertyValues, TemplateResult } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { Isomorphisms, Lens, PatternTypes } from '../../types';
import { Pattern } from '../../patterns/pattern';
import { Transformable } from '../../patterns/properties/transformable';
import { HasRedirect } from '../../patterns/properties/has-redirect';
import { PatternRecognizer } from '../../patterns/recognizer/pattern.recognizer';
import { getLenses } from './utils';

export class CortexEntityBase extends moduleConnect(LitElement) {
  @property()
  public hash!: string;

  @property()
  protected entity!: object;

  @property()
  protected isomorphisms!: Isomorphisms;

  // Lenses
  @property()
  protected selectedLens!: Lens | undefined;

  protected patternRecognizer!: PatternRecognizer;

  loadEntity(hash: string): Promise<any> {
    throw new Error('Method not implemented');
  }
  getLensElement(): Element | null {
    return null;
  }
  renderPlugins(): TemplateResult[] {
    return [];
  }

  connectedCallback() {
    super.connectedCallback();

    this.patternRecognizer = this.request(PatternTypes.Recognizer);

    this.addEventListener<any>(
      'lens-selected',
      (e: CustomEvent) => (this.selectedLens = e.detail.selectedLens)
    );
  }

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.entity = await this.loadEntity(this.hash);
    await this.entityUpdated();
  }

  update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.get('hash')) {
      this.loadEntity(this.hash).then(entity => {
        this.entity = entity;
        this.entityUpdated();
      });
    }
  }

  async entityUpdated() {
    const isomorphisms = await this.loadIsomorphisms(this.entity);
    this.isomorphisms = {
      entity: {
        id: this.hash,
        object: this.entity
      },
      isomorphisms: isomorphisms.reverse()
    };

    this.selectedLens = getLenses(this.patternRecognizer, this.isomorphisms)[0];
  }

  async loadIsomorphisms(entity: any): Promise<Array<any>> {
    let isomorphisms: any[] = [entity];

    const transformIsomorphisms = this.transformEntity(entity);
    isomorphisms = isomorphisms.concat(transformIsomorphisms);

    // Recursive call to get all isomorphisms from redirected entities
    const redirectedIsomorphisms = await this.redirectEntity(entity);
    isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
    return isomorphisms;
  }

  async redirectEntity(entity: object): Promise<Array<any>> {
    const patterns: Array<Pattern | HasRedirect> = this.patternRecognizer.recognize(entity);

    let isomorphisms: any[] = [];

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

  transformEntity<T extends object>(entity: T): Array<any> {
    const patterns: Array<Pattern | Transformable<any>> = this.patternRecognizer.recognize(entity);

    let isomorphisms: Array<any> = [];

    for (const pattern of patterns) {
      if ((pattern as Transformable<any>).transform) {
        const transformedEntities: Array<any> = (pattern as Transformable<any>).transform(entity);

        isomorphisms = isomorphisms.concat(transformedEntities);
      }
    }

    return isomorphisms;
  }
}
