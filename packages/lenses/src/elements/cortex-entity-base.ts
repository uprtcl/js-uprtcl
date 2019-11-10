import { Dictionary } from 'lodash';
import { LitElement, property, PropertyValues, TemplateResult } from 'lit-element';

import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, PatternTypes } from '@uprtcl/cortex';

import { getLenses, getIsomorphisms } from './utils';
import { Isomorphisms, Lens } from '../types';
import { LoadEntity, LOAD_ENTITY, selectById, selectEntities } from '@uprtcl/common';

export class CortexEntityBase extends reduxConnect(LitElement) {
  @property()
  public hash!: string;

  @property()
  protected entity: object | undefined = undefined;

  @property()
  protected isomorphisms: Isomorphisms | undefined = undefined;

  // Lenses
  @property()
  protected selectedLens!: Lens | undefined;

  protected patternRecognizer!: PatternRecognizer;
  protected entities: Dictionary<any> = {};
  protected entitiesRequested: Dictionary<boolean> = {};

  async loadEntity(hash: string): Promise<any> {
    if (this.entitiesRequested[hash]) return;

    this.entitiesRequested[hash] = true;

    const action: LoadEntity = {
      type: LOAD_ENTITY,
      payload: { hash }
    };
    this.store.dispatch(action);
  }
  selectEntity(hash: string): any | undefined {
    return this.entities[hash];
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

  firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.loadEntity(this.hash);
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has('hash') && this.hash && this.hash !== changedProperties.get('hash')) {
      this.entity = undefined;
      this.isomorphisms = undefined;
      this.entityUpdated();
      this.stateChanged(this.store.getState());
    }
  }

  entityUpdated() {
    this.isomorphisms = undefined;

    this.loadEntity(this.hash);
  }

  stateChanged(state: any) {
    this.entities = selectEntities(state).entities;
    this.entity = selectById(this.hash)(selectEntities(state));

    if (!this.entity) return;

    const { isomorphisms, entitiesToLoad } = getIsomorphisms(
      this.patternRecognizer,
      this.entity,
      (id: string) => this.selectEntity(id)
    );

    if (entitiesToLoad.length > 0) {
      entitiesToLoad.forEach(id => this.loadEntity(id));
    } else {
      this.isomorphisms = {
        entity: {
          id: this.hash,
          object: this.entity
        },
        isomorphisms: isomorphisms.reverse()
      };

      this.selectedLens = getLenses(this.patternRecognizer, this.isomorphisms)[0];
    }
  }
}
