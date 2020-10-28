import { LitElement, property, html, css, query } from 'lit-element';

export class UprtclFormString extends LitElement {
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
  newTitleEl!: any;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.acceptClick();
      }
    });

    this.addEventListener('keyup', event => {
      if (event.key === 'Esc') {
        event.preventDefault();
        this.cancelClick();
      }
    });
  }

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
          value: this.newTitleEl.value
        }
      })
    );
  }

  render() {
    return html`
      <div class="form">
        <uprtcl-textfield skinny id="text-input" value=${this.fieldValue} label=${this.fieldLabel}>
        </uprtcl-textfield>

        <div class="icon-container">
          <uprtcl-icon-button icon=${this.cancelIcon} @click=${this.cancelClick} button>
          </uprtcl-icon-button>
        </div>

        <div class="icon-container">
          <uprtcl-icon-button
            @click=${this.acceptClick}
            icon=${this.loading ? 'loading' : this.acceptIcon}
            button
          ></uprtcl-icon-button>
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
      uprtcl-textfield {
        margin-right: 8px;
      }
      .icon-container {
        margin-left: 8px;
        width: 48px;
        height: 48px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .actions uprtcl-button {
        width: 180px;
      }
    `;
  }
}
