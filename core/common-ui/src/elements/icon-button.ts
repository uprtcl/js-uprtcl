import { LitElement, html, css, property } from 'lit-element';
import { styles } from './styles.css';
import { icons } from './icons';

export class UprtclIconButton extends LitElement {
  @property({ type: String })
  icon!: string;

  @property({ type: Boolean })
  button = false;

  @property({ type: Boolean })
  skinny = false;

  @property({ type: Boolean })
  secondary = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  loading = false;

  /** Seems I cant prevent the click event from being emitted outside of this element  */

  render() {
    const classes = ['icon-button-layout'];
    const secondary = this.secondary ? '-secondary' : '';

    if (this.disabled) {
      classes.push('button-disabled');
    } else {
      if (this.button) {
        if (this.skinny) {
          classes.push(`button-skinny${secondary}`);
        } else {
          classes.push(`button-filled${secondary}`);
        }
        classes.push('cursor');
      } else {
        if (this.skinny) {
          classes.push(`button-skinny${secondary}`);
        } else {
          classes.push(`button-filled${secondary}-no-hover`);
        }
      }
    }

    if (['grid_view', 'list_view'].includes(this.icon)) {
      classes.push(`stroke-based`);
    }

    return html`
      <div class=${classes.join(' ')}>
        ${this.loading ? icons.loading : icons[this.icon]}
        <div class="slot-container"><slot></slot></div>
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
        svg {
          fill: var(--svg-fill);
          stroke: var(--svg-stroke);
          height: var(--svg-height, 24px);
        }
        .stroke-based svg {
          fill: var(--svg-fill, transparent);
          stroke: var(--svg-stroke, black);
        }
        .icon-button-layout {
          width: 36px;
          height: 36px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .slot-container {
          position: absolute;
          bottom: 2px;
          right: 2px;
          user-select: none;
        }
      `,
    ];
  }
}
