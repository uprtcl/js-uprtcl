import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';
import { icons } from './icons';

export class UprtclToggle extends LitElement {
  @property({ type: String })
  icon!: string;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  active = false;

  handleToggleClick() {
    if (!this.disabled) {
      this.dispatchEvent(new CustomEvent('toggle-click'));
    }
  }

  render() {
    return html`
      <div class="toggle-container ${this.disabled ? 'disabled' : ''}">
        ${this.icon !== undefined
          ? html`<div class="icon-container">${icons[this.icon]}</div>`
          : ''}
        <slot></slot>
        <div
          @click=${this.handleToggleClick}
          class="toggle toggled-${this.active ? 'on' : 'off'} ${this.disabled
            ? 'toggle-disabled'
            : ''}"
        ></div>
      </div>
    `;
  }

  static get styles() {
    return [
      styles,
      css`
        .toggle-container {
          display: flex;
          flex-direction: column;
        }
        .toggle {
          display: flex;
          position: relative;
          height: 1.5rem;
          width: 3rem;
          background-color: #c4c4c4;
          cursor: pointer;
          border-radius: var(--border-radius-complete);
        }
        .toggle:after {
          content: '';
          position: absolute;
          top: 0.25rem;
          height: 1rem;
          width: 1rem;
        }
        .toggled-on {
          background: var(--primary, blue);
        }
        .toggled-off:after {
          left: 0.25rem;
          background-color: gray;
          background: var(--white, #ffffff);
          border-radius: var(--border-radius-complete);
        }
        .toggled-on:after {
          right: 0.25rem;
          background: var(--white, #ffffff);
          border-radius: var(--border-radius-complete);
        }
        .disabled {
          opacity: 0.5;
        }
        .toggle-disabled {
          cursor: initial;
        }
        .icon-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-right: 10px;
        }
      `,
    ];
  }
}
