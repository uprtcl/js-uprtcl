import { LitElement, property, html, css, query } from 'lit-element';

import { EveesPopper } from './evees-popper';

export class EveesHelp extends LitElement {
  @query('#popper')
  popper!: EveesPopper;

  render() {
    return html` <evees-popper id="popper" icon="help_outline">
      <div class="help-content">
        <slot></slot>
      </div>
      <uprtcl-button @click=${() => (this.popper.showDropdown = false)}>
        close
      </uprtcl-button>
    </evees-popper>`;
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
    `;
  }
}
