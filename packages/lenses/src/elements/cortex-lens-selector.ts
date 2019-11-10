import { LitElement, property, html, query, css, PropertyValues } from 'lit-element';
import { Menu } from '@authentic/mwc-menu';
import '@authentic/mwc-list';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, PatternTypes } from '@uprtcl/cortex';

import { getLenses } from './utils';
import { Isomorphisms, Lens } from '../types';

export class CortexLensSelector extends moduleConnect(LitElement) {
  @property({ type: Object })
  public isomorphisms!: Isomorphisms;

  @property({ type: Array })
  private lenses!: Lens[];

  @query('#menu')
  menu!: Menu;

  static get styles() {
    return css`
      .hidden {
        visibility: hidden;
      }
    `;
  }

  firstUpdated() {
    const patternRecognizer: PatternRecognizer = this.request(PatternTypes.Recognizer);
    this.lenses = getLenses(patternRecognizer, this.isomorphisms);
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.get('isomorphisms')) {
      const patternRecognizer: PatternRecognizer = this.request(PatternTypes.Recognizer);

      this.lenses = getLenses(patternRecognizer, this.isomorphisms);
    }
  }

  show() {
    return this.lenses && this.lenses.length > 1;
  }

  render() {
    return html`
      <mwc-button
        class=${this.show() ? '' : 'hidden'}
        @click=${() => (this.menu.open = !this.menu.open)}
      >
        <mwc-icon>remove_red_eye</mwc-icon>
      </mwc-button>

      <mwc-menu id="menu" class=${this.show() ? '' : 'hidden'}>
        <mwc-list>
          ${this.show() &&
            this.lenses.map(
              lens =>
                html`
                  <mwc-list-item @click=${() => this.selectLens(lens)}>
                    ${lens.name}
                  </mwc-list-item>
                `
            )}
        </mwc-list>
      </mwc-menu>
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
