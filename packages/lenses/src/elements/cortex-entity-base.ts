import { LitElement, property, PropertyValues, TemplateResult } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import {
  PatternRecognizer,
  HasRedirect,
  Transformable,
  Pattern,
  PatternTypes
} from '@uprtcl/cortex';

import { getLenses } from './utils';
import { Isomorphisms, Lens } from '../types';
import { Dictionary } from 'lodash';

export class CortexEntityBase extends moduleConnect(LitElement) {
  @property()
  public hash!: string;

  @property()
  protected entity: object | undefined = undefined;

  @property()
  protected isomorphisms!: Isomorphisms;

  // Lenses
  @property()
  protected selectedLens!: Lens | undefined;

  @property()
  private loadedEntities: Dictionary<boolean> = {};

  protected patternRecognizer!: PatternRecognizer;

  loadEntity(hash: string): Promise<void> {
    throw new Error('Method not implemented');
  }
  selectEntity(hash: string): any {
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

  update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has('hash') && this.hash) {
      this.entity = undefined;
      this.loadEntity(this.hash);
    }
    if (changedProperties.get('entity') && this.entity) {
      this.entityUpdated();
    }
  }

  async entityUpdated() {
    if (!this.entity) return;

    try {
      const isomorphisms = this.getIsomorphisms(this.entity);
      this.isomorphisms = {
        entity: {
          id: this.hash,
          object: this.entity
        },
        isomorphisms: isomorphisms.reverse()
      };

      this.selectedLens = getLenses(this.patternRecognizer, this.isomorphisms)[0];
    } catch (e) {}
  }

  getIsomorphisms(entity: any): Array<any> {
    let isomorphisms: any[] = [entity];

    const transformIsomorphisms = this.transformEntity(entity);
    isomorphisms = isomorphisms.concat(transformIsomorphisms);

    // Recursive call to get all isomorphisms from redirected entities
    const redirectedIsomorphisms = this.redirectEntity(entity);
    isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
    return isomorphisms;
  }

  redirectEntity(entity: object): Array<any> {
    const patterns: Array<Pattern | HasRedirect> = this.patternRecognizer.recognize(entity);

    let isomorphisms: any[] = [];

    for (const pattern of patterns) {
      if ((pattern as HasRedirect).redirect) {
        const redirectHash = (pattern as HasRedirect).redirect(entity);

        if (redirectHash) {
          const redirectEntity = this.selectEntity(redirectHash);

          if (redirectEntity) {
            const redirectedIsomorphisms = this.getIsomorphisms(redirectEntity);

            isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
          } else if (!this.loadedEntities[redirectHash]) {
            this.loadedEntities[redirectHash] = true;
            this.loadEntity(redirectHash);

            throw new Error('Isomorphisms not yet loaded');
          }
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
