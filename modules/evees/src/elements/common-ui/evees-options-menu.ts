import { LitElement, property, html, css, query } from 'lit-element';

export interface MenuConfig {
  [key: string]: {
    text: string;
    graphic: string;
    disabled?: boolean;
  };
}

import '@material/mwc-icon';
import { EveesPopper } from './evees-popper';

export class EveesOptionsMenu extends LitElement {
  @property({ type: Object })
  config: MenuConfig = {};

  @property({ type: String })
  icon: string = 'more_vert';

  @query('#popper')
  popper!: EveesPopper;

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
    return html` <evees-popper id="popper" icon=${this.icon}>
      <mwc-list>
        ${Object.keys(this.config).map((itemKey) => {
          const item = this.config[itemKey];
          return item.disabled !== undefined && item.disabled
            ? html` <mwc-list-item graphic="icon" disabled>
                <span>${item.text}</span>
                <mwc-icon slot="graphic">${item.graphic}</mwc-icon>
              </mwc-list-item>`
            : html` <mwc-list-item graphic="icon" @click=${(e) => this.optionClicked(itemKey, e)}>
                <span>${item.text}</span>
                <mwc-icon slot="graphic">${item.graphic}</mwc-icon>
              </mwc-list-item>`;
        })}
      </mwc-list>
    </evees-popper>`;
  }

  static get styles() {
    return css``;
  }
}
