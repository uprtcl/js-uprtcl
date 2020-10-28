import { LitElement, html, css, query } from 'lit-element';

import { UprtclPopper } from './popper';

export class UprtclHelp extends LitElement {
  @query('#popper')
  popper!: UprtclPopper;

  render() {
    return html`
      <uprtcl-popper id="popper" icon="help_outline">
        <div class="help-content">
          <slot></slot>
        </div>
        <uprtcl-button @click=${() => (this.popper.showDropdown = false)}>
          close
        </uprtcl-button>
      </uprtcl-popper>
    `;
  }

  static get styles() {
    return css`
      .help-content {
        padding: 32px 16px;
        color: #4e585c;
      }

      uprtcl-button {
        width: 100%;
      }

      uprtcl-popper {
        --box-with: 200px;
      }
    `;
  }
}
