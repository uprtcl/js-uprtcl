import { LitElement, property, html, css } from 'lit-element';

import '@material/mwc-icon-button';
import '@authentic/mwc-card';

export class EveesPopper extends LitElement {
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
          <mwc-icon-button icon=${this.icon}></mwc-icon-button>
        </slot>
      </div>
      ${this.showDropdown
        ? html` <mwc-card
            id="popper-menu"
            class=${['info-box'].concat(classes).join(' ')}
          >
            <slot></slot>
          </mwc-card>`
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
      .popper-button {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
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
