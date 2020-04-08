import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import '@material/mwc-dialog';
import '@material/mwc-textfield';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { PermissionsElement } from './permissions-element';
import { SET_PUBLIC_READ } from '../graphql/queries';
import { BasicAdminPermissions } from '../services/basic-admin-control.service';

export class PermissionsAdmin extends moduleConnect(LitElement)
  implements PermissionsElement<BasicAdminPermissions> {
  @property()
  entityId!: string;

  @property()
  permissions!: BasicAdminPermissions;

  @property()
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
      }`
    });

    this.permissions = result.data.entity._context.patterns.accessControl.permissions;
    this.canWrite = result.data.entity._context.patterns.accessControl.canWrite;
  }

  getOwner() {
    return this.canWrite ? 'you' : this.permissions.canAdmin[0];
  }

  async togglePublicRead() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    const result = await client.mutate({
      mutation: SET_PUBLIC_READ,
      variables: {
        entityId: this.entityId,
        value: !this.permissions.publicRead
      }
    });

    this.permissions = result.data.setPublicRead._context.patterns.accessControl.permissions;
    this.canWrite = result.data.setPublicRead._context.patterns.accessControl.canWrite;
    this.loadPermissions();

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true
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
                <p>
                  This perspective is currently
                  ${this.permissions.publicRead ? 'public' : 'private'}
                </p>
                <p>
                  <mwc-button outlined icon="swap_horizontal" @click=${this.togglePublicRead}>
                    ${!this.permissions.publicRead
                      ? this.t('access-control:make-public')
                      : this.t('access-control:make-private')}
                  </mwc-button>
                </p>
              `
            : ''}
        </div>
      </div>
    `;
  }

  get styles() {
    return css`
      .title {
        margin-bottom: 32px;
      }
      .row {
        width: 100%;
      }
    `;
  }
}
