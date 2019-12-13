import { flatMap, Dictionary } from 'lodash';
import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, PropertyValues } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { GraphQlTypes } from '@uprtcl/common';
import { Hashed } from '@uprtcl/cortex';

import { Lens } from '../types';
import { SlotPlugin } from '../plugins/slot.plugin';

export class CortexEntityBase extends moduleConnect(LitElement) {
  @property()
  public hash!: string;

  @property()
  protected entity: Hashed<any> | undefined = undefined;

  // Lenses
  @property()
  protected selectedLens!: Lens | undefined;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('entity-updated', () => this.loadEntity(this.hash));
    this.addEventListener<any>(
      'lens-selected',
      (e: CustomEvent) => (this.selectedLens = e.detail.selectedLens)
    );
  }

  async loadEntity(hash: string): Promise<void> {
    this.entity = undefined;
    this.selectedLens = undefined;

    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);

    const result = await client.query({
      query: gql`
      {
        getEntity(id: "${hash}", depth: 1) {
          id
          raw
          isomorphisms {
            patterns {
              lenses {
                name
                render
              }
            }
          }
        }
      }
      `
    });

    const lenses = flatMap(
      result.data.getEntity.isomorphisms.reverse(),
      iso => iso.patterns.lenses
    ).filter(l => !!l);

    this.entity = result.data.getEntity.raw;

    this.selectedLens = lenses[0];
  }

  get slotPlugins(): Dictionary<SlotPlugin> {
    return {};
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has('hash') && this.hash && this.hash !== changedProperties.get('hash')) {
      this.loadEntity(this.hash);
    }
  }
}
