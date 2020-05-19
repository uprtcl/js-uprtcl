import { LitElement, html, property, css } from 'lit-element';

export class EveesDialog extends LitElement {
  @property({ type: String, attribute: 'primary-text' })
  primaryText: string = 'Ok';

  @property({ type: String, attribute: 'secondary-text' })
  secondaryText: string = 'Cancel';

  @property({ type: String, attribute: 'show-secondary' })
  showSecondary: string = 'false';

  @property({ type: Function, attribute: false })
  resolved: Function | undefined = undefined;

  secondaryClicked(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('secondary'));
    if (this.resolved) this.resolved(false);
  }

  primaryClicked(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('primary'));
    if (this.resolved) this.resolved(true);
  }

  render() {
    return html`
      <div class="modal">
        <div class="modal-content">
          <div class="slot-container">
            <slot></slot>
          </div>
          ${this.showSecondary === 'true'
            ? html`
                <mwc-button @click=${this.secondaryClicked}>
                  ${this.secondaryText}
                </mwc-button>
              `
            : ''}
          <mwc-button @click=${this.primaryClicked}>
            ${this.primaryText}
          </mwc-button>
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
        width: 90vw;
        margin: 0 auto;
        padding: 3vw 3vw;
        background-color: white;
        border-radius: 4px;
        box-shadow: 10px 10px 67px 0px rgba(0, 0, 0, 0.75);
      }

      .slot-container {
        margin-bottom: 3vw;
        max-height: calc(100vh - 200px);
        min-height: 50vh;
        overflow-y: auto;
      }
    `;
  }
}
