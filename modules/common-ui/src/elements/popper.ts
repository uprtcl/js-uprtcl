import { LitElement, property, html, css } from 'lit-element';
import { icons } from './icons';

export class UprtclPopper extends LitElement {
  @property({ type: String })
  icon: string = 'more_vert';

  @property({ type: String })
  position: string = 'bottom';

  @property({ type: Boolean, attribute: false })
  showDropdown: boolean = false;

  firstUpdated() {
    document.addEventListener('click', (event) => {
      const ix = event
        .composedPath()
        .findIndex((el: any) => el.id === 'popper-menu');
      if (ix === -1) {
        this.showDropdown = false;
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // document.removeEventListener('click', ...);
  }

  showDropDownClicked(e) {
    e.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  render() {
    const classes =
      this.position === 'bottom' ? ['info-box-bottom'] : ['info-box-right'];

    return html`
      <div class="popper-button" @click=${this.showDropDownClicked}>
        <slot name="icon">
          <div class="icon-container">${icons[this.icon]}</div>
        </slot>
      </div>
      ${this.showDropdown
        ? html` <uprtcl-card id="popper-menu" class="info-box">
            <slot></slot>
          </uprtcl-card>`
        : ''}
    `;
  }

  static get styles() {
    return css`
      :host {
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .icon-container {
        width: 36px;
        height: 36px;
        border-radius: 18px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .info-box {
        color: rgba(0, 0, 0, 0.87);
        z-index: 20;
        position: absolute;
        width: var(--box-width, 250px);
      }
      .info-box-bottom {
        right: 2px;
        top: 52px;
      }
      .info-box-right {
        top: 5px;
        left: 25px;
      }
    `;
  }
}
