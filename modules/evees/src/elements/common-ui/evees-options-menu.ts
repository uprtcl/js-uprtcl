import { LitElement, property, html, css } from "lit-element";

export interface MenuConfig {
	[key: string]: {
		text: string;
		graphic: string;
		disabled: boolean;
	}
}

import '@material/mwc-icon';

export class EveesOptionsMenu extends LitElement {

	@property({ type: Object })
  config: MenuConfig = {};

	@property({ type: Boolean, attribute: false })
  showDropdown: boolean = false;

	showDropDownClicked(e) {
    e.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  optionClicked(key: string, e) {
    e.stopPropagation();

    this.showDropdown = false;

    this.dispatchEvent(new CustomEvent('option-click', {
      bubbles: true,
      composed: true,
      detail: {
        key: key
      }
    }))
  }

	render() {
    return html`
      <mwc-icon @click=${this.showDropDownClicked}>more_vert</mwc-icon>
      ${this.showDropdown ? 
        html`
          <mwc-card class="info-box">
            <mwc-list>
              ${Object.keys(this.config).map(itemKey => {
                const item = this.config[itemKey];
                return item.disabled ? 
                    html`
                      <mwc-list-item graphic="icon" disabled>
                        <span>${item.text}</span>
                        <mwc-icon slot="graphic">${item.graphic}</mwc-icon>
                      </mwc-list-item>` : 
                    html`
                      <mwc-list-item graphic="icon" @click=${(e) => this.optionClicked(itemKey, e)}>
                        <span>${item.text}</span>
                        <mwc-icon slot="graphic">${item.graphic}</mwc-icon>
                      </mwc-list-item>`}
                )}
            </mwc-list>
          </mwc-card>` : ''}
        `
	}

	static get styles() {
    return css`
      :host {
        position: relative;
      }

      mwc-icon {
        user-select: none;
        color: #a2a8aa;
      }

      .info-box {
        color: rgba(0, 0, 0, 0.87);
        width: auto;
        z-index: 20;
        position: absolute;
        right: 2px;
        top: 34px;
        width: 200px;
      }`
  }
}