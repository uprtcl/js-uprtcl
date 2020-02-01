import { LitElement, property, html, query } from 'lit-element';

import '@material/mwc-dialog';
import '@material/mwc-textfield';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule } from '@uprtcl/cortex';

import { PermissionsElement } from './permissions-element';
import {
  OwnerPermissions,
  OwnerAccessControlService
} from '../services/owner-access-control.service';
import { ApolloClient, gql } from 'apollo-boost';
import { CHANGE_OWNER } from 'src/graphql/queries';

export class PermissionsOwner extends moduleConnect(LitElement)
  implements PermissionsElement<OwnerPermissions> {
  @property()
  permissions!: OwnerPermissions;
  @property()
  canWrite!: boolean;
  @property()
  entityId!: string;

  @query('mwc-dialog')
  dialog: any;

  newOwnerAddress!: string;

  firstUpdated() {
    this.loadPermissions();
  }

  async loadPermissions() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`{
        entity(id: "${this.entityId}") {
          _context {
            patterns {
              accessControl {
                canWrite
                permissions
              }
            }
          }
        }
      }`
    });

    this.permissions = result.data.entity._context.patterns.accessControl.permissions;
    this.canWrite = result.data.entity._context.patterns.accessControl.canWrite;
  }

  async changeOwner() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    const result = await client.mutate({
      mutation: CHANGE_OWNER,
      variables: {
        entityId: this.entityId,
        newOwner: this.newOwnerAddress
      }
    });

    this.permissions = result.data.entity._context.patterns.accessControl.permissions;
    this.canWrite = result.data.entity._context.patterns.accessControl.canWrite;
  }

  renderDialog() {
    return html`
      <mwc-dialog .heading=${this.t('access-control:transfer-ownership')}>
        <mwc-textfield
          outlined
          .label=${this.t('access-control:new-owner-address')}
          initialFocusAttribute
          @input=${e => (this.newOwnerAddress = e.target.value)}
        ></mwc-textfield>
        <mwc-button dialogAction="ok" slot="primaryAction" .disabled=${!this.newOwnerAddress}>
          ${this.t('access-control:confirm')}
        </mwc-button>
        <mwc-button dialogAction="cancel" slot="secondaryAction">
          ${this.t('access-control:cancel')}
        </mwc-button>
      </mwc-dialog>
    `;
  }

  render() {
    return html`
      ${this.renderDialog()}
      <span>${this.t('access-control:owner')}: ${this.permissions.owner}</span>
      <mwc-button raised icon="swap-horizontal" @click=${() => (this.dialog.open = true)}
        >${this.t('access-control:transfer-ownership')}</mwc-button
      >
    `;
  }
}
