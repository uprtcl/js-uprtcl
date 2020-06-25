import { LitElement, property, html, query, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { PermissionsElement } from './permissions-element';
import { DAOPermissions } from '../services/dao-access-control.service';
import { DAOConnector, DAOMember } from '../services/dao-connector.service';
import { AragonConnector } from '../services/aragon-connector';

import '@material/mwc-button';
import '@material/mwc-list';

export class PermissionsDAO extends moduleConnect(LitElement)
  implements PermissionsElement<DAOPermissions> {
  @property({ type: String })
  entityId!: string;

  @property({ attribute: false })
  permissions!: DAOPermissions;

  @property({ attribute: false })
  canWrite!: boolean;

  @property({ attribute: false })
  showAddMember: boolean = false;

  @property({ attribute: false })
  addingMember: boolean = false;

  members: DAOMember[] = [];

  daoConnector: DAOConnector;

  constructor() {
    super();
    this.daoConnector = new AragonConnector();
  }

  async firstUpdated() {
    await this.daoConnector.connect(this.permissions.owner);
    this.members = await this.daoConnector.getMembers();
    this.requestUpdate();
  }

  async addMember(address: string) {
    await this.daoConnector.addMember({ address, balance: '1' });
  }

  render() {
    return html`
      <h4>Owned by an Aragon DAO ${this.permissions.owner}</h4>
      <br />
      <b>Members:</b>
      <mwc-list>
        ${this.members.map(
          (member) => html`<mwc-list-item>${member.address}</mwc-list-item>`
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
    `;
  }

  static get styles() {
    return css``;
  }
}
