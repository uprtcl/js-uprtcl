import { LitElement, property, html } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { TextNode } from '@uprtcl/documents';
import { sharedStyles } from '@uprtcl/lenses';
import { ApolloClientModule } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

import '@material/mwc-top-app-bar';

export class WikiPage extends moduleConnect(LitElement) {
  @property({ type: String })
  pageHash!: string;

  @property({ type: Object })
  textNode!: TextNode;

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);
    const result = await client.query({
      query: gql`{
        getEntity(id: "${this.pageHash}") {
          id
          content {
            id
            entity {
              ... on TextNode {
                text
                links
              }
            }
          }
        }
      }`
    });

    this.textNode = result.data.getEntity.content.entity;
  }

  render() {
    if (!this.textNode)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    return html`
      <mwc-top-app-bar>
        <div slot="title">${this.textNode.text}</div>

        <div slot="actionItems">
          <cortex-actions .hash=${this.pageHash} ></cortex-actions>
        </div>
      </mwc-top-app-bar>

      <div class="column">
        ${this.textNode.links.map(
          link => html`
            <cortex-entity .hash=${link} lens-type="content"> </cortex-entity>
          `
        )}
      </div>
    `;
  }

  static get styles() {
    return sharedStyles;
  }
}
