import { ApolloClient, gql } from 'apollo-boost';
import { flatMap } from 'lodash-es';
import { LitElement, property, PropertyValues } from 'lit-element';

import { moduleConnect, Dictionary, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Hashed } from '@uprtcl/cortex';

import { Lens } from '../types';
import { SlotPlugin } from '../plugins/slot.plugin';

export class CortexEntityBase extends moduleConnect(LitElement) {
  logger = new Logger('CORTEX-ENTITY-BASE');

  @property()
  public hash!: string;

  @property({ attribute: 'lens-type' })
  public lensType!: string;

  @property({ type: Object })
  public context!: any;

  @property({ type: Object })
  protected entity!: Hashed<any>;

  // Lenses
  @property({ attribute: false })
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
    this.selectedLens = undefined;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    // We are also loading the content to have it cached in case the lens wants it
    const result = await client.query({
      query: gql`
      {
        entity(id: "${hash}") {
          id
          _context {
            patterns {
              lenses {
                name
                type
                render
              }
            }
          }
        }
      }
      `
    });

    const lenses = result.data.entity._context.patterns.lenses.filter(lens => !!lens);

    this.entity = { id: result.data.id, ...result.data.entity };

    if (this.lensType) {
      this.selectedLens = lenses.find(lens => lens.type === this.lensType);
    }

    if (this.selectedLens === undefined) {
      this.selectedLens = lenses[0];
    }

    this.logger.info(`Lens selected for entity ${this.hash}`, {
      selectedLens: this.selectedLens,
      lenses
    });
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
