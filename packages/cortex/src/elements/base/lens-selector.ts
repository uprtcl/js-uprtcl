import { LitElement, property, html, query, css } from 'lit-element';
import { Isomorphism, SelectedLens } from '../../types';
import { Menu } from '@authentic/mwc-menu';
import '@authentic/mwc-list';

export class LensSelector extends LitElement {
  @property({ type: Array })
  public isomorphisms!: Array<Isomorphism>;

  @query('#menu')
  menu!: Menu;

  static get styles() {
    return css`
      .hidden {
        visibility: hidden;
      }
    `;
  }

  show() {
    return (
      this.isomorphisms &&
      this.isomorphisms.reduce((count, isomorphism) => isomorphism.lenses.length + count, 0) > 0
    );
  }

  render() {
    return html`
      <mwc-button
        class=${this.show ? '' : 'hidden'}
        @click=${() => (this.menu.open = !this.menu.open)}
      >
        <mwc-icon>remove_red_eye</mwc-icon>
      </mwc-button>

      <mwc-menu id="menu" class=${this.show ? '' : 'hidden'}>
        <mwc-list>
          ${this.show() &&
            this.isomorphisms.map(
              (isomorphism, i) =>
                html`
                  ${isomorphism.lenses.map(
                    (lens, j) =>
                      html`
                        <mwc-list-item @click=${() => this.selectLens(i, j)}>
                          ${lens.lens}
                        </mwc-list-item>
                      `
                  )}
                  ${i < this.isomorphisms.length
                    ? html`
                        <mwc-list-divider></mwc-list-divider>
                      `
                    : html``}
                `
            )}
        </mwc-list>
      </mwc-menu>
    `;
  }

  selectLens(isomorphism: number, lens: number) {
    this.menu.open = false;
    const selectedLens: SelectedLens = { isomorphism, lens };
    this.dispatchEvent(
      new CustomEvent('lens-selected', { detail: { selectedLens }, bubbles: true, composed: true })
    );
  }
}
