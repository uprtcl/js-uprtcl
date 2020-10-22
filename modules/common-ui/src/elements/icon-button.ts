import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';
import { icons } from './icons';

export class UprtclIconButton extends LitElement {
  @property({ type: String })
  icon!: string;

  @property({ type: Boolean })
  button: boolean = false;

  @property({ type: Boolean })
  disabled: boolean = false;

  /** Seems I cant prevent the click event from being emitted outside of this element  */

  render() {
    const classes = ['icon-button-layout'];

    if (this.disabled) {
      classes.push('button-disabled');
    } else {
      classes.push('button-filled-secondary', 'cursor');
    }

    return html`
      <div class=${classes.join(' ')}>
        ${icons[this.icon]}
      </div>
    `;
  }

  static get styles() {
    return [
      styles,
      css`
        :host {
          display: inline-block;
        }
        .icon-button-layout {
          width: 36px;
          height: 36px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `
    ];
  }
}
