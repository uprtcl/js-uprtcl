import { LitElement, property, html, css } from "lit-element";

import '@material/mwc-icon-button';

export class EveesPopper extends LitElement {

  @property({ type: String })
  icon: string = 'more_vert';

	@property({ type: Boolean, attribute: false })
  showDropdown: boolean = false;

	showDropDownClicked(e) {
    e.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

	render() {
    return html`
      <mwc-icon-button @click=${this.showDropDownClicked} icon=${this.icon}></mwc-icon-button>
      ${this.showDropdown ? 
        html`
          <mwc-card class="info-box">
            <slot></slot>
          </mwc-card>` : ''}
        `
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
      }`
  }
}