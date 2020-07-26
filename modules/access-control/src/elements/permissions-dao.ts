import { LitElement, property, html, query, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { PermissionsElement } from './permissions-element';
import { DAOPermissions } from '../services/dao-access-control.service';
import {
  DAOConnector,
  DAOMember,
  DAOProposal,
} from '../services/dao-connector.service';
import { AragonConnector } from '../services/aragon-connector';

import '@material/mwc-button';
import '@material/mwc-list';

export class PermissionsDAO extends moduleConnect(LitElement)
  implements PermissionsElement<DAOPermissions> {
  @property({ type: String })
  entityId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  permissions!: DAOPermissions;

  @property({ attribute: false })
  canWrite!: boolean;

  @property({ attribute: false })
  showAddMember: boolean = false;

  @property({ attribute: false })
  addingMember: boolean = false;

  @property({ attribute: false })
  members: DAOMember[] = [];

  @property({ attribute: false })
  newMemberProposals: DAOProposal[] = [];

  daoConnector!: DAOConnector;

  async firstUpdated() {
    this.load();
  }

  async load() {
    this.loading = true;
    const ethConnection = this.request(
      'EthereumConnection'
    ) as EthereumConnection;

    this.daoConnector = new AragonConnector(ethConnection);
    const orgAddress = await this.daoConnector.orgAddresFromAgentAddress(
      this.permissions.owner
    );
    await this.daoConnector.connect(orgAddress);

    this.loadMembers();
    this.getNewMemberProposals();

    this.loading = false;
  }

  async loadMembers() {
    this.members = await this.daoConnector.getMembers();
    this.requestUpdate();
  }

  async getNewMemberProposals() {
    this.newMemberProposals = await this.daoConnector.getNewMemberProposals();
  }

  async addMember(address: string) {
    this.addingMember = true;
    await this.daoConnector.addMember({ address, balance: '1' });
    this.addingMember = false;
    this.showAddMember = false;
  }

  async voted(proposalId: string, value: boolean) {
    await this.daoConnector.vote(proposalId, value);
  }

  render() {
    if (this.loading)
      return html` <cortex-loading-placeholder></cortex-loading-placeholder> `;

    return html`
      <h4>Owned by an Aragon DAO agent: ${this.permissions.owner}</h4>
      <br />
      <b>DAO: ${this.daoConnector.daoAddress}</b><br />
      <b>Agent: ${this.daoConnector.agentAddress}</b><br />
      <br />
      <b>Members:</b>
      <mwc-list>
        ${this.members.map(
          (member) =>
            html`<mwc-list-item
              ><evees-author user-id=${member.address}></evees-author
            ></mwc-list-item>`
        )}
      </mwc-list>
      ${this.showAddMember
        ? html`<evees-string-form
            value=""
            label="address"
            ?loading=${this.addingMember}
            @cancel=${() => (this.showAddMember = false)}
            @accept=${(e) => this.addMember(e.detail.value)}
          ></evees-string-form>`
        : html` <mwc-button @click=${() => (this.showAddMember = true)}>
            add member
          </mwc-button>`}

      <br /><br /><b>New members proposals:</b>
      ${this.newMemberProposals.map(
        (proposal) =>
          html`<proposal-ui
            .proposal=${proposal}
            @voted=${(e) => this.voted(proposal.id, e.detail.value)}
          ></proposal-ui>`
      )}
    `;
  }

  static get styles() {
    return css``;
  }
}
