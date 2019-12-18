import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { GraphQlTypes } from '@uprtcl/common';

export class WikiPage extends reduxConnect(LitElement) {
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
    console.log(result)
    const { text } = result.data.getEntity.content.entity
    this.title = text ? text : "Title goes here"
  }

  render() {
    return html`
      <div class="header">
        <div class="page">
          <h3> ${this.title} </h3>
        </div>
        <div class="actions">
          <cortex-actions .hash=${this.pageHash} />
        </div>
      </div>
      <cortex-entity .hash=${this.pageHash}> </cortex-entity>
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
