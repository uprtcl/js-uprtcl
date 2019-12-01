import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, PropertyValues, TemplateResult } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { GraphQlTypes } from '@uprtcl/common';
import { PatternRecognizer, PatternTypes } from '@uprtcl/cortex';

import { getLenses, getIsomorphisms } from './utils';
import { Isomorphisms, Lens } from '../types';
import { Dictionary } from 'lodash';

export class CortexEntityBase extends moduleConnect(LitElement) {
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
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);

    const result = await client.query({
      query: gql`
      {
        getEntity(id: "${hash}", depth: 1) {
          id
          raw
          content {
            ... on TextNode {
              text
              type
            }
          }
        }
      }
      `
    });

    console.log(result);

    return result.data.getEntity.raw;
  }

  async entityUpdated() {
    this.isomorphisms = undefined;
    this.entity = await this.loadEntity(this.hash);

    if (!this.entity) return;

    const isomorphisms = await getIsomorphisms(this.patternRecognizer, this.entity, (id: string) =>
      this.loadEntity(id)
    );

    this.isomorphisms = {
      entity: {
        id: this.hash,
        object: this.entity
      },
      isomorphisms: isomorphisms.reverse()
    };

    this.selectedLens = getLenses(this.patternRecognizer, this.isomorphisms)[0];
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
    this.entityUpdated();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has('hash') && this.hash && this.hash !== changedProperties.get('hash')) {
      this.entity = undefined;
      this.isomorphisms = undefined;
      this.entityUpdated();
    }
  }
}
