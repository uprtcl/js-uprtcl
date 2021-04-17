import { LitElement, property, html, css, query } from 'lit-element';

export interface MenuOption {
  text: string;
  icon?: string;
  skinny?: boolean;
  disabled?: boolean;
  background?: string;
}

export type MenuOptions = Map<string, MenuOption>;

import { UprtclPopper } from './popper';

export class UprtclOptionsMenu extends LitElement {
  @property({ type: Object })
  config: MenuOptions = new Map();

  @property({ type: String })
  icon = 'more_vert';

  @property({ type: Boolean })
  skinny = false;

  @property({ type: Boolean })
  secondary = false;

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
          key: key,
        },
      })
    );
  }

  render() {
    return html`
      <uprtcl-popper id="popper" icon=${this.icon}>
        <slot name="icon" slot="icon"
          ><uprtcl-icon-button
            icon=${this.icon}
            button
            ?skinny=${this.skinny}
            ?secondary=${this.secondary}
          ></uprtcl-icon-button
        ></slot>
        <uprtcl-list>
          ${Array.from(this.config.entries()).map(([itemKey, item]) => {
            return item.disabled !== undefined && item.disabled
              ? html`
                  <uprtcl-list-item icon=${item.icon ? item.icon : ''} disabled>
                    <span>${item.text}</span>
                  </uprtcl-list-item>
                `
              : html`
                  <uprtcl-list-item
                    icon=${item.icon ? item.icon : ''}
                    @click=${(e) => this.optionClicked(itemKey, e)}
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
