import { LitElement, property, html } from 'lit-element';

import { PermissionsElement } from './permissions-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { OwnerPermissions } from 'src/services/owner-access-control.service';

export class PermissionsOwner extends moduleConnect(LitElement)
  implements PermissionsElement<OwnerPermissions> {
  @property()
  permissions!: OwnerPermissions;

  render() {
    return html`
      <span>Owner is ${this.permissions.owner}</span>
    `;
  }
}
