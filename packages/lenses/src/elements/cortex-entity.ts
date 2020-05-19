import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, PropertyValues, html } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Entity } from '@uprtcl/cortex';

import { Lens } from '../types';

export class CortexEntity extends moduleConnect(LitElement) {
  logger = new Logger('CORTEX-ENTITY');

  @property({ type: String })
  public ref!: string;

  @property({ attribute: 'lens-type' })
  public lensType!: string;

  @property({ type: Object })
  public context!: any;

  @property({ type: Object })
  protected entity!: Entity<any>;

  // Lenses
  @property({ attribute: false })
  protected selectedLens!: Lens | undefined;

  protected client: ApolloClient<any> | undefined = undefined;

  firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('entity-updated', () => this.loadEntity(this.ref));
    this.addEventListener<any>(
      'lens-selected',
      (e: CustomEvent) => (this.selectedLens = e.detail.selectedLens)
    );
  }

  getContentLenses() {}

  async loadEntity(ref: string): Promise<void> {
    if (!this.client) throw new Error('client undefined');

    this.selectedLens = undefined;

    // We are also loading the content to have it cached in case the lens wants it
    const result = await this.client.query({
      query: gql`
      {
        entity(ref: "${ref}") {
          id
          _context {
            object
            casID
            
            content {
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
        }
      }
      `,
    });

    if (!result.data || !result.data.entity)
      throw new Error(`Could not find entity with reference ${ref}`);

    const entityResult = result.data.entity;

    const lenses = entityResult._context.content._context.patterns.lenses.filter((lens) => !!lens);

    this.entity = {
      id: entityResult.id,
      object: entityResult._context.object,
      casID: entityResult._context.casID,
    };

    if (this.lensType) {
      this.selectedLens = lenses.find((lens) => lens.type === this.lensType);
    }

    if (this.selectedLens === undefined) {
      this.selectedLens = lenses[0];
    }

    this.logger.info(`Lens selected for entity ${this.ref}`, {
      selectedLens: this.selectedLens,
      lenses,
    });
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has('ref') && this.ref && this.ref !== changedProperties.get('ref')) {
      this.loadEntity(this.ref);
    }
  }

  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    this.logger.info('renderLens()', { context: this.context });

    if (!this.selectedLens) return html``;

    return this.selectedLens.render(this.entity, this.context);
  }

  render() {
    return html`
      ${!this.selectedLens
        ? html` <cortex-loading-placeholder></cortex-loading-placeholder> `
        : this.renderLens()}
    `;
  }
}
