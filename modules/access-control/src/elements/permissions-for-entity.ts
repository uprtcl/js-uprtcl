import { LitElement, property, html } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

export class PermissionsForEntity extends moduleConnect(LitElement) {
  @property()
  public hash!: String;

  @property()
  private permissions: String | undefined;

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
              _context {
                  patterns {
                      accessControl {
                          permissions
                      }
                  }
              }
          }
      }
      `
    });

    this.permissions = result.data.entity._context.patterns.accessControl.permissions;
  }

  render() {
    if (!this.permissions)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    return html`
      <cortex-pattern .pattern=${this.permissions}></cortex-pattern>
    `;
  }
}
