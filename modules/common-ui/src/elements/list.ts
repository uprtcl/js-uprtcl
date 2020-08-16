import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';

export class UprtclList extends LitElement {
  render() {
    return html`<slot></slot>`;
  }

  static get styles() {
    return [styles, css``];
  }
}
