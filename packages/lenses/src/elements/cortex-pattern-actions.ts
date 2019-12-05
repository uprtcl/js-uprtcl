import { LitElement, html, property, query, PropertyValues, css } from 'lit-element';
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

export class CortexPatternActions extends moduleConnect(LitElement) {
  @property({ type: Object })
  public isomorphisms!: Isomorphisms;

  @query('#menu')
  menu!: Menu;

  @property({ type: Array })
  private actions!: PatternAction[];

  patternRecognizer!: PatternRecognizer;

  getActions() {
    let actions: PatternAction[] = [];

    for (const isomorphism of this.isomorphisms.isomorphisms) {
      const patterns: Array<Pattern | HasActions> = this.patternRecognizer.recognize(isomorphism);
      for (const pattern of patterns) {
        if ((pattern as HasActions).getActions) {
          actions = actions.concat(
            (pattern as HasActions).getActions(isomorphism, this.isomorphisms.entity.id)
          );
        }
      }
    }

    this.actions = actions;
  }

  firstUpdated() {
    this.patternRecognizer = this.request(PatternTypes.Recognizer);
    this.getActions();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.get('isomorphisms')) {
      this.getActions();
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
                  <mwc-list-item @click=${() => action.action(this)}>
                    <mwc-icon slot="graphic">${action.icon}</mwc-icon>
                    ${action.title}
                  </mwc-list-item>
                `
            )}
        </mwc-list>
      </mwc-menu>
    `;
  }
}
