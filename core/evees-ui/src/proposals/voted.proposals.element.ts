import { LitElement, property, html, css } from 'lit-element';

import { ClientRemote, VotedProposals, Logger } from '@uprtcl/evees';

import { servicesConnect } from '../container/multi-connect.mixin.js';

export class VotedProposalsElement extends servicesConnect(LitElement) {
  logger = new Logger('VOTED-PROPOSAL');

  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ attribute: false })
  loading = true;

  protected remote!: ClientRemote<VotedProposals>;

  async firstUpdated() {
    if (!this.isConnected) return;
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('proposalId')) {
      this.load();
    }
  }

  async load() {
    this.loading = true;
    if (!this.proposalId) return;

    this.remote = this.evees.getRemote(this.remoteId);
    this.loading = false;
    this.requestUpdate();
  }

  render() {
    if (this.loading) {
      return '';
    }
    return html`<div>Proposal UI</div>`;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex: 1 1 0px;
        overflow: hidden;
      }
    `;
  }
}
