import { LitElement, html, property, css } from 'lit-element';

import { MenuConfig } from './evees-options-menu';

import './evees-options-menu';

export class ItemWithMenu extends LitElement {
  @property({ type: String })
  text: string = '';

  @property({ type: String })
  selected: string = 'false';

  @property({ type: Object })
  config: MenuConfig = {};

  elementClicked() {
    this.dispatchEvent(
      new CustomEvent('item-click', {
        bubbles: true,
        composed: true,
      })
    );
  }

  optionClicked(e: CustomEvent) {
    this.dispatchEvent(
      new CustomEvent('option-click', {
        bubbles: true,
        composed: true,
        detail: {
          option: e.detail.key,
        },
      })
    );
  }

  render() {
    let classes: string[] = [];
    classes.push('item-row');
    if (this.selected === 'true') classes.push('item-selected');

    return html`
      <div class=${classes.join(' ')} @click=${this.elementClicked}>
        <div class="text-container">${this.text}</div>
        <evees-options-menu
          @option-click=${this.optionClicked}
          .config=${this.config}
        ></evees-options-menu>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        cursor: pointer;
      }

      mwc-icon {
        user-select: none;
      }

      .item-row {
        position: relative;
        width: 100%;
        display: flex;
        padding: 6px 0px;
        transition: all 0.1s ease-in;
      }

      .item-selected {
        background-color: rgb(200, 200, 200, 0.2);
      }

      .item-row:hover {
        background-color: #e8ecec;
      }

      .text-container {
        padding-left: 16px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }
    `;
  }
}
