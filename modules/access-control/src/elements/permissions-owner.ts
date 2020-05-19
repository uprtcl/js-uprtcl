import { LitElement, property, html, query, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { TextFieldBase } from '@material/mwc-textfield/mwc-textfield-base';
import '@material/mwc-dialog';
import '@material/mwc-textfield';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { PermissionsElement } from './permissions-element';
import { OwnerPermissions } from '../services/owner-access-control.service';
import { SET_CAN_WRITE } from '../graphql/queries';
import { prettyAddress } from './support';
import { CortexModule } from '@uprtcl/cortex';

export class PermissionsOwner extends moduleConnect(LitElement)
  implements PermissionsElement<OwnerPermissions> {
  @property({ type: String })
  entityId!: string;

  @property({ attribute: false })
  permissions!: OwnerPermissions;

  @property({ attribute: false })
  canWrite!: boolean;

  @property({ attribute: false })
  newOwnerAddress!: string;

  @property({ attribute: false })
  showDialog: boolean = false;

  @property({ attribute: false })
  changingOwner: boolean = false;

  @query('#new-address')
  newAddressEl!: TextFieldBase;

  client!: ApolloClient<any>;
  recognizer!: ApolloClient<any>;

  firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.loadPermissions();
  }

  async loadPermissions() {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${this.entityId}") {
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
      }`,
    });

    this.permissions = result.data.entity._context.patterns.accessControl.permissions;
    this.canWrite = result.data.entity._context.patterns.accessControl.canWrite;
  }

  async showTransferDialog() {
    this.showDialog = true;
    await this.updateComplete;

    this.newAddressEl.focus();
  }

  async changeOwner() {
    this.showDialog = false;
    this.changingOwner = true;

    const newAddress = this.newAddressEl.value;

    const result = await this.client.mutate({
      mutation: SET_CAN_WRITE,
      variables: {
        entityId: this.entityId,
        userId: newAddress,
      },
    });

    this.permissions = result.data.setCanWrite._context.patterns.accessControl.permissions;
    this.canWrite = result.data.setCanWrite._context.patterns.accessControl.canWrite;

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );

    this.changingOwner = false;
  }

  getOwner() {
    return this.canWrite ? 'you' : prettyAddress(this.permissions.owner);
  }

  renderDialog() {
    return html`
      <evees-dialog
        primary-text="Transfer"
        secondary-text="Cancel"
        @primary=${this.changeOwner}
        @secondary=${() => (this.showDialog = false)}
        show-secondary="true"
      >
        <mwc-textfield
          class="address-field"
          id="new-address"
          outlined
          .label=${this.t('access-control:new-owner-address')}
        ></mwc-textfield>
      </evees-dialog>
    `;
  }

  render() {
    return html`
      ${this.showDialog ? this.renderDialog() : ''}
      <div class="row title">
        <strong>${this.t('access-control:owner')}:</strong> ${this.getOwner()}
      </div>
      ${this.canWrite
        ? html`
            <evees-loading-button
              icon="swap_horizontal"
              @click=${this.showTransferDialog}
              loading=${this.changingOwner ? 'true' : 'false'}
              label=${this.t('access-control:transfer-ownership')}
            >
            </evees-loading-button>
          `
        : ''}
    `;
  }

  static get styles() {
    return css`
      mwc-button {
        width: 220px;
      }

      .address-field {
        margin-top: 50px;
      }

      .title {
        margin-bottom: 32px;
      }
      .row {
        width: 100%;
      }
    `;
  }
}
