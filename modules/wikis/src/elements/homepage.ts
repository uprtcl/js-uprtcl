import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { Secured, selectCanWrite, PermissionsStatus } from '@uprtcl/common';
import { PatternTypes, PatternRecognizer } from '@uprtcl/cortex';
import { GraphQlTypes } from '@uprtcl/common';

export class Homepage extends reduxConnect(LitElement) {
  @property({ type: String })
  wikiHash!: string;

  @property({ type: String })
  title!: string;

  
  recentPerspectives() {
    return html`
      <h2> Welcome to ${this.title} </h2>

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
