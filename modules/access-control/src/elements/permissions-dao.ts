import { LitElement, property, html, query, css } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { PermissionsElement } from './permissions-element';
import { DAOPermissions } from 'src/services/dao-access-control.service';

export class PermissionsDAO extends moduleConnect(LitElement)
  implements PermissionsElement<DAOPermissions> {
  @property({ type: String })
  entityId!: string;

  @property({ attribute: false })
  permissions!: DAOPermissions;

  @property({ attribute: false })
  canWrite!: boolean;

  firstUpdated() {
  }

  render() {
    return html`
      <h1>Owned by a DAO</h1>
    `;
  }

  static get styles() {
    return css`
    `;
  }
}
