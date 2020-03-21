import { LitElement, html, property, css } from "lit-element";

import { MenuConfig } from "./evees-options-menu";

import "./evees-options-menu";

export class ItemWithMenu extends LitElement {

  @property({ type: String })
  text: string = '';

  @property({ type: Object })
  config: MenuConfig = {};

  elementClicked() {
    this.dispatchEvent(new CustomEvent('item-click', {
      bubbles: true,
      composed: true
    }));
  }

  optionClicked(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent('option-click', {
      bubbles: true,
      composed: true,
      detail: {
        option: e.detail.key
      }
    }));
  }

  render() {
    return html`
      <div class="item-row" @click=${this.elementClicked}>
        <div class="text-container">${this.text}</div>
        <evees-options-menu @option-click=${this.optionClicked} .config=${this.config}></evees-options-menu>       
      </div>
    `
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

      .item-row:hover {
        background-color: #e8ecec;
      }

      .text-container {
        padding-left: 16px;
        flex-grow:1;
      }
    `
  }
}