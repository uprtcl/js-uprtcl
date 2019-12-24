import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { GraphQlTypes } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

import '@material/mwc-top-app-bar';

export class WikiPage extends moduleConnect(LitElement) {
  @property({ type: String })
  pageHash!: string;

  @property({ type: String })
  title!: string;

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    const result = await client.query({
      query: gql`{
        getEntity(id: "${this.pageHash}") {
          content {
            entity {
              ... on TextNode {
                text
              }
            }
          }
        }
      }`
    });

    const { text } = result.data.getEntity.content.entity;
    this.title = text ? text : 'Title goes here';
  }

  render() {
    return html`
      <mwc-top-app-bar>
        <div slot="title">${this.title}</div>

        <div slot="actionItems">
          <cortex-actions .hash=${this.pageHash}></cortex-actions>
        </div>
      </mwc-top-app-bar>

      <cortex-entity .hash=${this.pageHash} lens-type="content"> </cortex-entity>
    `;
  }

  static get styles() {
    return css`
      .header {
        display: flex;
        flex-direction: row;
        background-color: #fff;
      }
      .page {
        width: 90%;
        text-align: left;
        border-style: solid;
        border-width: 2px;
      }
      .actions {
        width: 10%;
        border-style: solid;
        border-width: 2px;
        border-left-width: 0px;
      }
    `;
  }
}
