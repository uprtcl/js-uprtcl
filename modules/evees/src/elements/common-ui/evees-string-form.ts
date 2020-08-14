import { LitElement, property, html, css, query } from 'lit-element';

import '@material/mwc-icon';
import '@material/mwc-textfield';
import { TextFieldBase } from '@material/mwc-textfield/mwc-textfield-base';

export class EveesStringForm extends LitElement {
  @property({ type: String, attribute: 'value' })
  fieldValue: string = '';

  @property({ type: String, attribute: 'label' })
  fieldLabel: string = 'value';

  @property({ type: String, attribute: 'cancel-icon' })
  cancelIcon: string = 'clear';

  @property({ type: String, attribute: 'accept-icon' })
  acceptIcon: string = 'done';

  @property({ type: Boolean })
  loading: boolean = false;

  @query('#text-input')
  newTitleEl!: TextFieldBase;

  firstUpdated() {
    setTimeout(() => this.newTitleEl.focus(), 50);
  }

  cancelClick() {
    this.dispatchEvent(new CustomEvent('cancel'));
  }

  acceptClick() {
    this.dispatchEvent(
      new CustomEvent('accept', {
        detail: {
          value: this.newTitleEl.value,
        },
      })
    );
  }

  render() {
    return html`
      <div class="form">
        <mwc-textfield
          outlined
          id="text-input"
          value=${this.fieldValue}
          label=${this.fieldLabel}
        >
        </mwc-textfield>

        <div class="icon-container">
          <mwc-icon-button icon=${this.cancelIcon} @click=${this.cancelClick}>
          </mwc-icon-button>
        </div>

        <div class="icon-container">
          ${this.loading
            ? html`<cortex-loading-placeholder
                size="20"
              ></cortex-loading-placeholder>`
            : html`<mwc-icon-button
                @click=${this.acceptClick}
                icon=${this.acceptIcon}
              ></mwc-icon-button>`}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .form {
        display: flex;
        align-items: center;
      }
      .actions {
        margin-top: 16px;
      }
      .icon-container {
        margin-left: 8px;
        width: 48px;
        height: 48px;
      }
      .actions uprtcl-mwc-button {
        width: 180px;
      }
    `;
  }
}
