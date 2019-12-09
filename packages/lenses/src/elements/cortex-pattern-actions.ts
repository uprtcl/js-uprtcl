import { LitElement, html, property, query, PropertyValues, css } from 'lit-element';
import { flatMap } from 'lodash';
import { Menu } from '@authentic/mwc-menu';
import '@material/mwc-icon-button';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import {
  Pattern,
  HasActions,
  PatternRecognizer,
  PatternTypes,
  PatternAction
} from '@uprtcl/cortex';

import { Isomorphisms } from '../types';
import { ApolloClient, gql } from 'apollo-boost';
import { GraphQlTypes } from '@uprtcl/common';

export class CortexPatternActions extends moduleConnect(LitElement) {
  @property({ type: String })
  public entityId!: string;

  @query('#menu')
  menu!: Menu;

  @property({ type: Array })
  private actions!: PatternAction[] | undefined;

  async loadActions() {
    this.actions = undefined;
    if (!this.entityId) return;

    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);

    const result = await client.query({
      query: gql`
      {
        getEntity(id: "${this.entityId}", depth: 1) {
          id
          raw
          isomorphisms {
            patterns {
              actions {
                title
                icon
                action
              }
            }
          }
        }
      }
      `
    });

    const isomorphisms = result.data.getEntity.isomorphisms;

    const actions = flatMap(isomorphisms.reverse(), iso => iso.patterns.actions);
    this.actions = actions.filter(iso => !!iso);
  }

  firstUpdated() {
    this.loadActions();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.get('entityId')) {
      this.loadActions();
    }
  }

  static get styles() {
    return css`
      .hidden {
        display: none;
      }
    `;
  }

  get show() {
    return this.actions && this.actions.length > 0;
  }

  render() {
    return html`
      <mwc-icon-button
        icon="more_vert"
        class=${this.show ? '' : 'hidden'}
        @click=${() => (this.menu.open = !this.menu.open)}
      ></mwc-icon-button>

      <mwc-menu id="menu" class=${this.show ? '' : 'hidden'}>
        <mwc-list>
          ${this.actions &&
            this.actions.map(
              action =>
                html`
                  <mwc-list-item
                    @click=${() =>
                      action.action(newContent => {
                        this.updateContent(newContent);
                      })}
                  >
                    <mwc-icon slot="graphic">${action.icon}</mwc-icon>
                    ${action.title}
                  </mwc-list-item>
                `
            )}
        </mwc-list>
      </mwc-menu>
    `;
  }

  updateContent(newContent) {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        bubbles: true,
        composed: true,
        detail: { newContent }
      })
    );
  }
}
