import { LitElement, property, html, query, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { PermissionsElement } from './permissions-element';
import { DAOPermissions } from '../services/dao-access-control.service';
import { DAOConnector } from '../services/dao-connector.service';
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

  members: string[] = [];

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

  render() {
    return html`
      <h4>Owned by an Aragon DAO ${this.permissions.owner}</h4>
      <mwc-list>
        ${this.members.map(member => html`<mwc-list-item>${member}</mwc-list-item>`)}
      </mwc-list>
      <mwc-button>add member</mwc-button>
    `;
  }

  static get styles() {
    return css`
    `;
  }
}
