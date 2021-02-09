import { LitElement, html, css, query, property } from 'lit-element';

import { UprtclPopper } from './popper';

export class UprtclHelp extends LitElement {
  @property({ type: String })
  position = 'top-right';

  @query('#popper')
  popper!: UprtclPopper;

  render() {
    return html`
      <uprtcl-popper id="popper" icon="help_outline" position=${this.position} skinny>
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
        text-transform: none;
        font-weight: normal;
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
