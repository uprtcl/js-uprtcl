import { LitElement, property, html, css, query } from 'lit-element';

export interface MenuConfig {
  [key: string]: {
    text: string;
    icon?: string;
    skinny?: boolean;
    disabled?: boolean;
    background?: string;
  };
}

import { UprtclPopper } from './popper';

export class UprtclOptionsMenu extends LitElement {
  @property({ type: Object })
  config: MenuConfig = {};

  @property({ type: String })
  icon: string = 'more_vert';

  @query('#popper')
  popper!: UprtclPopper;

  optionClicked(key: string, e) {
    e.stopPropagation();

    this.popper.showDropdown = false;

    this.dispatchEvent(
      new CustomEvent('option-click', {
        bubbles: true,
        composed: true,
        detail: {
          key: key
        }
      })
    );
  }

  render() {
    return html`
      <uprtcl-popper id="popper" icon=${this.icon}>
        <slot name="icon" slot="icon"
          ><uprtcl-icon-button icon=${this.icon} button></uprtcl-icon-button
        ></slot>
        <uprtcl-list>
          ${Object.keys(this.config).map(itemKey => {
            const item = this.config[itemKey];
            return item.disabled !== undefined && item.disabled
              ? html`
                  <uprtcl-list-item icon=${item.icon ? item.icon : ''} disabled>
                    <span>${item.text}</span>
                  </uprtcl-list-item>
                `
              : html`
                  <uprtcl-list-item
                    icon=${item.icon ? item.icon : ''}
                    @click=${e => this.optionClicked(itemKey, e)}
                  >
                    <span>${item.text}</span>
                  </uprtcl-list-item>
                `;
          })}
        </uprtcl-list>
      </uprtcl-popper>
    `;
  }

  static get styles() {
    return css``;
  }
}
