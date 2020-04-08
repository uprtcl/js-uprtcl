import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, PropertyValues, html } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Entity } from '@uprtcl/cortex';

import { Lens } from '../types';

export class CortexEntity extends moduleConnect(LitElement) {
  logger = new Logger('CORTEX-ENTITY');

  @property()
  public link!: string;

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

    this.addEventListener('entity-updated', () => this.loadEntity(this.link));
    this.addEventListener<any>(
      'lens-selected',
      (e: CustomEvent) => (this.selectedLens = e.detail.selectedLens)
    );
  }

  async loadEntity(hash: string): Promise<void> {
    if (!this.client) throw new Error('client undefined');

    this.selectedLens = undefined;

    // We are also loading the content to have it cached in case the lens wants it
    const result = await this.client.query({
      query: gql`
      {
        entity(ref: "${hash}") {
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

    this.logger.info(`Lens selected for entity ${this.link}`, {
      selectedLens: this.selectedLens,
      lenses
    });
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has('link') && this.link && this.link !== changedProperties.get('link')) {
      this.loadEntity(this.link);
    }
  }

  /**
   * @returns the rendered selected lens
   */
  renderLens() {
    this.logger.info('renderLens()', { context: this.context });

    if (!this.selectedLens) return html``;

    return this.selectedLens.render(this.context);
  }

  render() {
    return html`
      ${!this.selectedLens
        ? html`
            <cortex-loading-placeholder></cortex-loading-placeholder>
          `
        : this.renderLens()}
    `;
  }
}
