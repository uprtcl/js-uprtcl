import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';
import { icons } from './icons';

export class UprtclButton extends LitElement {
  @property({ type: String })
  icon!: string;

  @property({ type: Boolean })
  transition: boolean = false;

  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: Boolean })
  skinny: boolean = false;

  @property({ type: Boolean })
  raised: boolean = false;

  connectedCallback() {
    super.connectedCallback();
    this.checkDisabled();
  }

  checkDisabled() {
    if (this.disabled) {
      this.addEventListener('click', e => {
        e.stopPropagation();
      });
    }
  }

  render() {
    let classes = ['button-layout', 'button-text'];

    if (this.disabled) {
      classes.push('button-disabled');
    } else {
      classes.push('cursor');

      if (this.skinny) {
        classes.push('button-skinny');
      } else {
        classes.push('button-filled');
      }

      if (this.raised) {
        classes.push('button-raised');
      }

      if (this.transition) {
        classes.push('bg-transition');
      }
    }

    return html`
      <div class=${classes.join(' ')}>
        ${this.icon !== undefined
          ? html`
              <div class="icon-container">${icons[this.icon]}</div>
            `
          : ''}

        <slot></slot>
      </div>
    `;
  }

  static get styles() {
    return [
      styles,
      css`
        :host {
          width: initial;
          display: block;
        }
        .cursor {
          cursor: pointer;
        }
        .button-layout {
          border-radius: 4px;
          display: flex;
          flex-direction: row;
          justify-content: center;
          line-height: 36px;
          height: 36px;
          padding: 0px 16px;
        }
        .bg-transition {
          transition: background-color 0.5s ease;
        }
        .icon-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-right: 10px;
        }
      `
    ];
  }
}
