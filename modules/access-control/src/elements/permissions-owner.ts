import { LitElement, property, html, query } from 'lit-element';

import '@material/mwc-dialog';
import '@material/mwc-textfield';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule, ApolloClient, gql } from '@uprtcl/graphql';

import { PermissionsElement } from './permissions-element';
import {
  OwnerPermissions
} from '../services/owner-access-control.service';
import { SET_CAN_WRITE } from '../graphql/queries';

export class PermissionsOwner extends moduleConnect(LitElement)
  implements PermissionsElement<OwnerPermissions> {
  @property()
  entityId!: string;

  @property()
  permissions!: OwnerPermissions;
  @property()
  canWrite!: boolean;

  @query('mwc-dialog')
  dialog: any;

  @property({ type: String })
  newOwnerAddress!: string;

  firstUpdated() {
    this.loadPermissions();
  }

  async loadPermissions() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`{
        entity(id: "${this.entityId}") {
          id
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
      mutation: SET_CAN_WRITE,
      variables: {
        entityId: this.entityId,
        userId: this.newOwnerAddress
      }
    });

    this.permissions = result.data.changeOwner._context.patterns.accessControl.permissions;
    this.canWrite = result.data.changeOwner._context.patterns.accessControl.canWrite;
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
        <mwc-button @click=${this.changeOwner} dialogAction="ok" slot="primaryAction" .disabled=${!this.newOwnerAddress}>
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
      <span><strong>${this.t('access-control:owner')}:</strong> ${this.permissions.owner}</span>
      ${this.canWrite ? html`
        <mwc-button raised icon="swap_horizontal" @click=${() => (this.dialog.open = true)}
          >${this.t('access-control:transfer-ownership')}</mwc-button
        >` : ''}
      
    `;
  }
}
