import { LitElement, property, html, css } from 'lit-element';

export class UprtclPopper extends LitElement {
  @property({ type: String })
  icon: string = 'more_vert';

  @property({ type: String })
  position: string = 'bottom-right';

  @property({ type: Boolean, attribute: 'disable-dropdown' })
  disableDropdown: boolean = false;

  @property({ type: Boolean, attribute: false })
  showDropdown: boolean = false;

  firstUpdated() {
    document.addEventListener('click', event => {
      const ix = event.composedPath().findIndex((el: any) => el.id === 'popper-menu');
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
    if (!this.disableDropdown) {
      e.stopPropagation();
      this.showDropdown = !this.showDropdown;
    }
  }

  render() {
    const positions = {
      'bottom-left': 'info-box-bottom-left',
      'bottom-right': 'info-box-bottom-right',
      right: 'info-box-right'
    };
    let classes = [positions[this.position]];

    classes.push('info-box');

    return html`
      <div class="popper-button" @click=${this.showDropDownClicked}>
        <slot name="icon">
          <uprtcl-icon-button button icon=${this.icon}></uprtcl-icon-button>
        </slot>
      </div>
      ${this.showDropdown
        ? html`
            <uprtcl-card id="popper-menu" class=${classes.join(' ')}>
              <slot></slot>
            </uprtcl-card>
          `
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
      }

      .info-box {
        color: rgba(0, 0, 0, 0.87);
        z-index: 20;
        position: absolute;
        width: var(--box-width, 'initial');
        max-height: var(--max-height, initial);
        overflow: var(--overflow, 'visible');
      }
      .info-box-bottom-right {
        right: 0px;
        top: calc(100% + 5px);
      }
      .info-box-bottom-left {
        left: 0px;
        top: calc(100% + 5px);
      }
      .info-box-right {
        top: 5px;
        left: calc(100% + 5px);
      }
    `;
  }
}
