import { LitElement, property, html, css } from 'lit-element';

import '@material/mwc-icon-button';
import '@authentic/mwc-card';

export class EveesPopper extends LitElement {
  @property({ type: String })
  icon: string = 'more_vert';

  @property({ type: Boolean, attribute: false })
  showDropdown: boolean = false;

  firstUpdated() {
    document.addEventListener('click', (event) => {
      const ix = event.composedPath().findIndex((el: any) => el.id === 'popper-menu');
      if (ix === -1) {
        this.showDropdown = false;
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // document.removeEventListener('click', ...);
  }

  showDropDownClicked(e) {
    e.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  render() {
    return html`
      <mwc-icon-button @click=${this.showDropDownClicked} icon=${this.icon}></mwc-icon-button>
      ${this.showDropdown
        ? html` <mwc-card id="popper-menu" class="info-box">
            <slot></slot>
          </mwc-card>`
        : ''}
    `;
  }

  static get styles() {
    return css`
      :host {
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .info-box {
        color: rgba(0, 0, 0, 0.87);
        z-index: 20;
        position: absolute;
        right: 2px;
        top: 52px;
        width: 250px;
      }
    `;
  }
}
