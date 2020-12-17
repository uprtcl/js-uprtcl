import { LitElement, property, PropertyValues, html } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Entity } from '@uprtcl/cortex';

import { Lens } from '../types';

export class CortexEntity extends moduleConnect(LitElement) {
  logger = new Logger('CORTEX-ENTITY');

  @property({ type: String })
  public uref!: string;

  @property({ attribute: 'lens-type' })
  public lensType!: string;

  @property({ type: Object })
  public context!: any;

  @property({ type: Object })
  protected entity!: Entity<any>;

  // Lenses
  @property({ attribute: false })
  protected selectedLens!: Lens | undefined;

  protected client: EveesClient | undefined = undefined;

  firstUpdated() {
    this.client = this.request(EveesClientModule.bindings.Client);
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('entity-updated', () => this.loadEntity(this.uref));
    this.addEventListener<any>(
      'lens-selected',
      (e: CustomEvent) => (this.selectedLens = e.detail.selectedLens)
    );
  }

  getContentLenses() {}

  async loadEntity(uref: string): Promise<void> {
    if (!this.client) throw new Error('client undefined');

    this.selectedLens = undefined;

    // We are also loading the content to have it cached in case the lens wants it
    const result = await this.client.query({
      query: gql`
      {
        entity(uref: "${uref}") {
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
      throw new Error(`Could not find entity with reference ${uref}`);

    const entityResult = result.data.entity;

    const lenses = entityResult._context.content._context.patterns.lenses.filter(
      (lens) => !!lens
    );

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

    this.logger.info(`Lens selected for entity ${this.uref}`, {
      selectedLens: this.selectedLens,
      lenses,
    });
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      changedProperties.has('uref') &&
      this.uref &&
      this.uref !== changedProperties.get('uref')
    ) {
      this.loadEntity(this.uref);
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
        ? html` <uprtcl-loading></uprtcl-loading> `
        : this.renderLens()}
    `;
  }
}
