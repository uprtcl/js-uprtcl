import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { Secured, selectCanWrite, PermissionsStatus } from '@uprtcl/common';
import { PatternTypes, PatternRecognizer } from '@uprtcl/cortex';
import { GraphQlTypes } from '@uprtcl/common';

export class Homepage extends reduxConnect(LitElement) {
  @property({ type: String })
  wikiHash!: string;

  async firstUpdated() {
    // const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    // const result = await client.query({
    //   query: gql`{
    //     getEntity(id: "${this.pageHash}") {
    //       entity {
    //         ... on TextNode {
    //           text
    //         }
    //       }
    //     }
    //   }`
    // });
    // console.log(result);
  }

  recentPerspectives() {
    return html`
      <h4> Recent new perspectives </h4>
      <perspectives-list .rootPerspectiveId=${this.wikiHash} />
    `;
  }

  render() {
    return html`
      ${this.recentPerspectives()}
    `;
  }
}
