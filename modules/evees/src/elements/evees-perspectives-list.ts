import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';

export class PerspectivesList extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ attribute: false })
  perspectivesIds: Array<string> = [];

  async firstUpdated() {
    this.getOtherPersepectives();
  }

  perspectiveClicked(id: string) {
    this.dispatchEvent(
      new CustomEvent('perspective-selected', {
        bubbles: true,
        composed: true,
        detail: {
          id
        }
      })
    );
  }

  mergeClicked(id: string) {
    this.dispatchEvent(
      new CustomEvent('merge-perspective', {
        bubbles: true,
        composed: true,
        detail: {
          id
        }
      })
    );
  }

  getOtherPersepectives = async () => {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`{
          entity(id: "${this.perspectiveId}") {
            id
            ... on Perspective {
              context {
                perspectives {
                  id
                } 
              } 
            } 
          }
        }`
    });
    this.perspectivesIds = result.data.entity.context.perspectives.map(p => p.id);
    this.logger.info('getOtherPersepectives()', { result, perspectivesIds: this.perspectivesIds });
  };

  render() {
    const otherPerspectivesIds = this.perspectivesIds.filter(id => id !== this.perspectiveId);

    return html`
      <strong>Other Perspectives</strong><br />
      ${otherPerspectivesIds.length > 0
        ? html`
            <mwc-list>
              ${otherPerspectivesIds.map(id => {
                return html`
                  <div class="row">
                    <mwc-list-item @click=${() => this.perspectiveClicked(id)}>
                      <span class="perspective-id-label">${id}</span>
                    </mwc-list-item>
                    <mwc-button
                      icon="call_merge"
                      @click=${() => this.mergeClicked(id)}
                      label="Merge"
                    ></mwc-button>
                  </div>
                `;
              })}
            </mwc-list>
          `
        : html`
            <span>There are no other perspectives for this context</span>
          `}
    `;
  }

  static get styles() {
    return css`
      .row {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .perspective-id-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
    `;
  }
}
