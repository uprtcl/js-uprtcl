import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, query, css, PropertyValues } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Lens } from '../types';

export class CortexLensSelector extends moduleConnect(LitElement) {
  @property({ type: String })
  public hash!: string;

  @property({ type: Array })
  private lenses!: Lens[] | undefined;

  @query('#menu')
  menu!: any;

  static get styles() {
    return css`
      .hidden {
        visibility: hidden;
      }
    `;
  }

  async loadLenses() {
    this.lenses = undefined;
    if (!this.hash) return;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    const result = await client.query({
      query: gql`
      {
        entity(uref: "${this.hash}") {
          id
          _context {
            content {
              id
              _context {

                patterns {
                  lenses {
                    type
                    name
                    render
                  }
                }
              }
            }
          }
        }
      }
      `
    });

    const lenses = result.data.entity._context.content._context.patterns.lenses;

    this.lenses = lenses.filter(iso => !!iso);
  }

  firstUpdated() {
    this.loadLenses();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.get('hash')) {
      this.loadLenses();
    }
  }

  show() {
    return this.lenses && this.lenses.length > 1;
  }

  render() {
    return html`
      <uprtcl-icon-button
        icon="remove_red_eye"
        class=${this.show() ? '' : 'hidden'}
        @click=${() => (this.menu.open = !this.menu.open)}
        button
      ></uprtcl-icon-button>

      <uprtcl-menu id="menu" class=${this.show() ? '' : 'hidden'}>
        <uprtcl-list>
          ${this.lenses &&
            this.lenses.map(
              lens =>
                html`
                  <uprtcl-list-item @click=${() => this.selectLens(lens)}>
                    ${this.t(lens.name)}
                  </uprtcl-list-item>
                `
            )}
        </uprtcl-list>
      </uprtcl-menu>
    `;
  }

  selectLens(lens: Lens) {
    this.menu.open = false;
    this.dispatchEvent(
      new CustomEvent('lens-selected', {
        detail: { selectedLens: lens },
        bubbles: true,
        composed: true
      })
    );
  }
}
