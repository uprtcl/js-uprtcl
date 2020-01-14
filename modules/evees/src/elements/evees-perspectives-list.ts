import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { ApolloClientModule } from '@uprtcl/common';
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
    this.dispatchEvent(new CustomEvent('perspective-selected', {
      bubbles: true,
      composed: true,
      detail: {
        id
      }
    }))
  }

  mergeClicked(id: string) {
    this.dispatchEvent(new CustomEvent('merge-perspective', {
      bubbles: true,
      composed: true,
      detail: {
        id
      }
    }))
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
    return html`
      <h4>Other Perspectives</h4>
      ${this.perspectivesIds.length > 0
        ? html`
            <ul>
              ${this.perspectivesIds.filter(id => id !== this.perspectiveId).map(id => {
                return html`
                  <li @click=${() => this.perspectiveClicked(id)}>${id}</li>
                  <button @click=${() => this.mergeClicked(id)}>merge</button>
                `;
              })}
            </ul>
          `
        : ''}
    `;
  }
}
