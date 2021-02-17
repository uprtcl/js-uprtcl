import { LitElement, html, property, css } from 'lit-element';
import { MenuConfig } from './options-menu';

export class UprtclDialog extends LitElement {
  @property({ attribute: false })
  resolved: Function | undefined = undefined;

  @property({ type: Object })
  options: MenuConfig = {};

  optionClicked(e, option) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('option-selected', { detail: { option }, bubbles: true, composed: true })
    );
    if (this.resolved) this.resolved(option);
  }

  render() {
    const options = Object.getOwnPropertyNames(this.options).reverse();

    return html`
      <div class="modal">
        <div class="modal-content">
          <div class="slot-container">
            <slot></slot>
          </div>
          <div class="buttons-container">
            ${options.map(option => {
              const details = this.options[option];
              return html`
                <uprtcl-button
                  @click=${e => (details.disabled ? undefined : this.optionClicked(e, option))}
                  icon=${details.icon as string}
                  ?disabled=${details.disabled !== undefined ? details.disabled : false}
                  ?skinny=${details.skinny !== undefined ? details.skinny : false}
                  style=${details.background ? `--background-color: ${details.background}` : ''}
                >
                  ${this.options[option].text}
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
        position:relative;
        width: 50vw;
        max-width: 800px;
        min-width:420px;
        margin: 0 auto;
        padding: 1rem;
        background-color: white;
        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
        border-radius: 10px;
      }
      .slot-container {
        margin-bottom: 3vw;
        max-height: calc(100vh - 200px);
        min-height: 200px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
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
