import { LitElement, html, css, query } from 'lit-element';

import { UprtclPopper } from './popper';

export class UprtclHelp extends LitElement {
  @query('#popper')
  popper!: UprtclPopper;

  render() {
    return html`
      <uprtcl-popper id="popper" icon="help_outline" position="top-right">
        <div class="help-content">
          <slot></slot>
        </div>
        <uprtcl-button @click=${() => (this.popper.showDropdown = false)}> Close </uprtcl-button>
      </uprtcl-popper>
    `;
  }

  static get styles() {
    return css`
      .help-content {
        padding: 32px 16px;
        color: var(--gray);
        background: var(--white);
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
