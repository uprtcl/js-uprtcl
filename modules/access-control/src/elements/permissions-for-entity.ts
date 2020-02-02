import { LitElement, property, html } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

export class PermissionsForEntity extends moduleConnect(LitElement) {
  @property()
  public hash!: String;

  @property()
  private permissions: String | undefined;
  @property()
  private canWrite: boolean | undefined;

  firstUpdated() {
    this.loadPermissions();
  }

  async loadPermissions() {
    this.permissions = undefined;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    const result = await client.query({
      query: gql`
      {
          entity(id: "${this.hash}") {
            id
              _context {
                  patterns {
                      accessControl {
                          permissions
                          canWrite
                      }
                  }
              }
          }
      }
      `
    });

    this.permissions = result.data.entity._context.patterns.accessControl.permissions;
    this.canWrite = result.data.entity._context.patterns.accessControl.canWrite;
  }

  render() {
    if (!this.permissions)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    return html`
      <cortex-pattern
        .pattern=${this.permissions}
        .context=${{ canWrite: this.canWrite, entityId: this.hash }}
      ></cortex-pattern>
    `;
  }
}
