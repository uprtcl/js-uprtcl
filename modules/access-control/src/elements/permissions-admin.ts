import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import '@material/mwc-dialog';
import '@material/mwc-textfield';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { PermissionsElement } from './permissions-element';
import { SET_PUBLIC_READ } from '../graphql/queries';
import { BasicAdminPermissions } from '../services/basic-admin-control.service';
import { prettyAddress } from './support';

export class PermissionsAdmin extends moduleConnect(LitElement)
  implements PermissionsElement<BasicAdminPermissions> {
  @property()
  entityId!: string;

  @property({ type: Object, attribute: false })
  permissions!: BasicAdminPermissions;

  @property({ type: Boolean, attribute: false })
  canWrite!: boolean;

  firstUpdated() {
    this.loadPermissions();
  }

  async loadPermissions() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
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

  getOwner() {
    return this.canWrite ? 'you' : prettyAddress(this.permissions.canAdmin[0]);
  }

  async togglePublicRead() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    const result = await client.mutate({
      mutation: SET_PUBLIC_READ,
      variables: {
        entityId: this.entityId,
        value: !this.permissions.publicRead,
      },
    });

    this.permissions = result.data.setPublicRead._context.patterns.accessControl.permissions;
    this.canWrite = result.data.setPublicRead._context.patterns.accessControl.canWrite;
    this.loadPermissions();

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  }

  render() {
    return html`
      <div class="container">
        <div class="row title">
          <strong>${this.t('access-control:owner')}:</strong> ${this.getOwner()}
        </div>
        <div class="row">
          ${this.canWrite
            ? html`
                <mwc-button
                  outlined
                  icon=${this.permissions.publicRead ? 'visibility_off' : 'visibility'}
                  @click=${this.togglePublicRead}
                >
                  ${!this.permissions.publicRead
                    ? this.t('access-control:make-public')
                    : this.t('access-control:make-private')}
                </mwc-button>
              `
            : ''}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      mwc-button {
        width: 220px;
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
