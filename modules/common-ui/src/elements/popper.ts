import { Logger } from '@uprtcl/micro-orchestrator';
import { LitElement, property, html, css } from 'lit-element';

export class UprtclPopper extends LitElement {
  logger = new Logger('UPRTCL-POPPER');

  @property({ type: String })
  icon: string = 'more_vert';

  @property({ type: String })
  position: string = 'bottom-right';

  @property({ type: Boolean, attribute: 'disable-dropdown' })
  disableDropdown: boolean = false;

  @property({ attribute: false })
  showDropdown: boolean = false;

  @property({ attribute: false })
  popperId!: string;

  handleDocClick = event => {
    const ix = event.composedPath().findIndex((el: any) => el.id === this.popperId);
    if (ix === -1) {
      this.showDropdown = false;
    }
  };

  firstUpdated() {
    this.popperId = `popper-menu-${Math.floor(Math.random() * 1000000)}`;
    document.addEventListener('click', this.handleDocClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocClick);
  }

  showDropDownClicked(e) {
    if (!this.disableDropdown) {
      this.showDropdown = !this.showDropdown;
    }
  }

  updated(changedProperties) {
    /** use litelement update watcher to inform the world about the stati of the dropdown, this way
     * it works also if showDropdown is set from elsewhere
     */
    if (changedProperties.has('showDropdown')) {
      this.dispatchEvent(
        new CustomEvent('drop-down-changed', { detail: { shown: this.showDropdown } })
      );
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
      <div class="popper-container" id=${this.popperId}>
        <div class="popper-button" @click=${this.showDropDownClicked}>
          <slot name="icon">
            <uprtcl-icon-button button icon=${this.icon}></uprtcl-icon-button>
          </slot>
        </div>
        ${this.showDropdown
          ? html`
              <uprtcl-card class=${classes.join(' ')}>
                <slot></slot>
              </uprtcl-card>
            `
          : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      .popper-container {
        position: relative;
      }

      .info-box {
        color: rgba(0, 0, 0, 0.87);
        z-index: 20;
        position: absolute;
        width: var(--box-width, 'initial');
        min-width: var(--box-min-width, 200px);
        max-height: var(--max-height, initial);
        overflow: var(--overflow, 'visible');
        user-select: none;
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
