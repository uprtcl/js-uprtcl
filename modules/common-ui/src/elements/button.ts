import { LitElement, html } from 'lit-element';
import { cssFramework } from './miligram.css';

export class UprtclButton extends LitElement {
  render() {
    return html`<div class="button">text</div>`;
  }

  static get styles() {
    return cssFramework;
  }
}
