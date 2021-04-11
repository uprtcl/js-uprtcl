import { html } from 'lit-element';
import { ProposalsList } from './evees-proposals-list';

export class ProposalsDropdown extends ProposalsList {
  render() {
    return html`<uprtcl-popper
      id="proposals-popper"
      position="bottom-left"
      class="proposals-popper"
    >
      <uprtcl-button slot="icon" class="proposals-button">
        proposals (${this.proposalsIds.length})
      </uprtcl-button>
      <div class="list-container">${super.render()}</div>
    </uprtcl-popper>`;
  }
}
