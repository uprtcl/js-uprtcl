import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';
import { icons } from './icons';

export class UprtclIconButton extends LitElement {
  @property({ type: String })
  icon!: string;

  render() {
    return html`<div class="button-color button-layout">
      ${icons[this.icon]}
    </div>`;
  }

  static get styles() {
    return [
      styles,
      css`
        :host {
          display: inline-block;
        }
        .button-color {
          background-color: #9dbacc;
        }
        .button-layout {
          width: 3.6rem;
          height: 3.6rem;
          border-radius: 1.8rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `,
    ];
  }
}
