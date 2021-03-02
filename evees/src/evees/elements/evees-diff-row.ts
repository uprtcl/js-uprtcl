import { icons } from '@uprtcl/common-ui';
import { html, LitElement, property, internalProperty, css } from 'lit-element';

export class EveesDiffRow extends LitElement {
  @property({ type: String })
  type: string = 'edit';

  @internalProperty()
  color: string = 'yellow';

  icon: any;

  connectedCallback() {
    super.connectedCallback();

    switch (this.type) {
      case 'edit':
        this.icon = icons.edit;
        this.color = 'yellow';
        break;

      case 'add':
        this.icon = icons.add_box;
        this.color = 'green';
        break;

      case 'remove':
        this.icon = icons.indeterminate_check_box;
        this.color = 'red';
        break;
    }
  }

  render() {
    return html`<div class="change-row">
      <div class=${'icon ' + `${this.color}-icon`}>${this.icon}</div>
      <slot></slot>
    </div>`;
  }

  static get styles() {
    return css`
      .change-row {
        padding: 6px 0px;
        display: flex;
        align-items: center;
      }
      .icon {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        margin-right: 14px;
      }
      .green-icon svg {
        fill: #abdaab;
      }
      .red-icon svg {
        fill: #dab6ab;
      }
      .yellow-icon svg {
        fill: #d1d079;
      }
    `;
  }
}
