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
      <mwc-list-item @click=${this.elementClicked} hasMeta>
        <span>${this.text}</span>
        <mwc-icon @click=${this.showDropDownClicked} slot="meta">more_vert</mwc-icon>
        ${this.showDropdown ? 
          html`
            <mwc-card class="info-box">
              <slot>I AM A MENU</slot>
            </mwc-card>` : ''}        
      </mwc-list-item>
    `
  }

  static get styles() {
    return css`
      :host {
        position: relative;
      }
      
      mwc-list-item {
        overflow: visible;
      }

      .info-box {
        width: auto;
        z-index: 20;
        position: absolute;
        right: 10px;
        top: 45px;
        width: 200px;
      }`
  }
}