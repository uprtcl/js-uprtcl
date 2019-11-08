import { LitElement, html, property, query, PropertyValues, css } from 'lit-element';
import { Menu } from '@authentic/mwc-menu';

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

  getActions() {
    const patternRecognizer: PatternRecognizer = this.request(PatternTypes.Recognizer);

    let actions: PatternAction[] = [];

    for (const isomorphism of this.isomorphisms.isomorphisms) {
      const patterns: Array<Pattern | HasActions> = patternRecognizer.recognize(isomorphism);
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
    this.getActions();
  }

  update(changedProperties: PropertyValues) {
    super.update(changedProperties);

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

  render() {
    return html`
      <mwc-button
        class=${this.actions ? '' : 'hidden'}
        @click=${() => (this.menu.open = !this.menu.open)}
      >
        <mwc-icon>more_vert</mwc-icon>
      </mwc-button>

      <mwc-menu id="menu" class=${this.actions ? '' : 'hidden'}>
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
