import { moduleConnect } from "@uprtcl/micro-orchestrator";
import { LitElement, html, property, css } from "lit-element";

export class WikiDrawerItem extends moduleConnect(LitElement) {

  @property({ type: String })
  text: string = '';

  @property({ type: Boolean, attribute: false })
  showDropdown: boolean = false;

  elementClicked() {
    this.dispatchEvent(new CustomEvent('itemClicked', {
      bubbles: true,
      composed: true
    }));
  }

  showDropDownClicked(e) {
    e.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  render() {
    return html`
      <div class="item-row" @click=${this.elementClicked}>
        <div class="text-container">${this.text}</div>
        <mwc-icon @click=${this.showDropDownClicked} slot="meta">more_vert</mwc-icon>
        ${this.showDropdown ? 
          html`
            <mwc-card class="info-box">
              <slot>I AM A MENU</slot>
            </mwc-card>` : ''}        
      </div>
    `
  }

  static get styles() {
    return css`
      :host {
        position: relative;
      }
      
      .item-row {
        width: 100%;
        display: flex;
      }

      .text-container {
        padding-left: 16px;
        flex-grow:1;
      }

      .info-box {
        width: auto;
        z-index: 20;
        position: absolute;
        right: 0px;
        top: 0px;
        width: 200px;
      }`
  }
}