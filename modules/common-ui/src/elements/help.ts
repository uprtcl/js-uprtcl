import { LitElement, html, css, query, property } from 'lit-element';

import { UprtclPopper } from './popper';

export class UprtclHelp extends LitElement {
  @property({ type: String })
  position = 'top-right';

  @query('#popper')
  popper!: UprtclPopper;

  render() {
    return html`
      <uprtcl-popper id="popper" icon="help_outline" position=${this.position} skinny secondary>
        <div class="help-content">
          <slot></slot>
        </div>
      </uprtcl-popper>
    `;
  }

  static get styles() {
    return css`
      .help-content {
        padding: 1rem 1rem;
        color: var(--gray);
        background: var(--white);
        text-transform: none;
        font-weight: normal;
        font-size: 14px;
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
