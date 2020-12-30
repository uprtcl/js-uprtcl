import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';
import { icons } from './icons';

type ButtonVariant = 'normal' | 'long' | 'icon';
export class UprtclButton extends LitElement {
  @property({ type: String })
  icon!: string;

  @property({ type: Boolean })
  transition = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  skinny = false;

  @property({ type: Boolean })
  raised = false;

  @property({ type: String })
  variant?: ButtonVariant = 'normal';

  /** Seems I cant prevent the click event from being emitted outside of this element  */

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

    if (this.variant === 'normal') {
      classes.push('variant-normal');
    } else if (this.variant === 'long') {
      classes.push('variant-long');
    } else if (this.variant === 'icon') {
      classes.push('variant-icon');
    }

    return html`
      <div class=${classes.join(' ')}>
        ${this.icon ? html` <div class="icon-container">${icons[this.icon]}</div> ` : ''}
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
          background: transparent;
        }
        .button-layout {
          border-radius: var(--border-radius-complete);
          display: flex;
          flex-direction: row;
          justify-content: var(--justify-content, center);
          line-height: 24px;
        }
        .icon-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-right: 10px;
        }
        .variant-normal {
          padding: 0.6rem 1.5rem;
        }
        .variant-long {
          padding: 1rem 4rem;
          font-weight: 700;
        }
        .variant-icon {
          padding: 0;
        }
      `,
    ];
  }
}
