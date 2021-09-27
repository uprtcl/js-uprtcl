import { LitElement, html, property, css, internalProperty } from 'lit-element';
import { MenuOptions } from './options-menu';

export class UprtclDialog extends LitElement {
  @property({ attribute: false })
  resolved: Function | undefined = undefined;

  @property({ type: Object })
  options: MenuOptions = new Map();

  @property({ type: Boolean, attribute: 'show-close' })
  showClose: boolean = false;

  @property({ type: String })
  size: 'large' | 'medium' = 'medium';

  @internalProperty()
  dialogId!: string;

  handleDocClick = (event) => {
    const ix = event.composedPath().findIndex((el: any) => el.id === this.dialogId);
    if (ix === -1) {
      this.emitClose();
    }
  };

  async firstUpdated() {
    console.log('firstUpdated()');

    this.dialogId = `dialog-${Math.floor(Math.random() * 1000000)}`;

    /** await a cycle to prevent old clicks from being detected */
    setTimeout(() => document.addEventListener('click', this.handleDocClick), 500);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocClick);
  }

  emitClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  optionClicked(e, option) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('option-selected', { detail: { option }, bubbles: true, composed: true })
    );
    if (this.resolved) this.resolved(option);
  }

  render() {
    const options = Array.from(this.options.entries()).reverse();
    const sizeClass = `${this.size}-modal`;
    return html`
      <div class="modal">
        <div class=${`modal-content ${sizeClass}`} id=${this.dialogId}>
          <div class="slot-container">
            <slot></slot>
            ${this.showClose
              ? html`<uprtcl-icon-button
                  class="top-right"
                  icon="clear"
                  button
                  skinny
                  @click=${() => this.emitClose()}
                ></uprtcl-icon-button>`
              : ''}
          </div>
          <div class="buttons-container">
            ${options.map(([option, details]) => {
              return html`
                <uprtcl-button
                  @click=${(e) => (details.disabled ? undefined : this.optionClicked(e, option))}
                  icon=${details.icon as string}
                  ?disabled=${details.disabled !== undefined ? details.disabled : false}
                  ?skinny=${details.skinny !== undefined ? details.skinny : false}
                  style=${details.background ? `--background-color: ${details.background}` : ''}
                >
                  ${details.text}
                </uprtcl-button>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .modal {
        position: fixed;
        z-index: 100;
        height: 100%;
        width: 100%;
        background-color: #b8b8b86d;
        left: 0;
        top: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .modal-content {
        position: relative;
        margin: 0 auto;
        padding: 1rem;
        background-color: white;
        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
      }
      .large-modal {
        width: 90vw;
        height: 90vh;
      }
      /** TODO: make sure size works fine on all cases */
      .medium-modal {
        width: 50vw;
        min-width: 800px;
      }
      .slot-container {
        height: 100%;
        min-height: 200px;
        overflow-y: auto;
      }
      .top-right {
        position: absolute;
        top: 12px;
        right: 12px;
      }
      .buttons-container {
        display: flex;
        justify-content: flex-end;
        width: 100%;
        flex-direction: row;
      }
      .buttons-container uprtcl-button {
        width: 150px;
        margin-left: 12px;
      }
    `;
  }
}
