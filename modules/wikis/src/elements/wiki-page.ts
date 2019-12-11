import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { Secured, selectCanWrite, PermissionsStatus } from '@uprtcl/common';
import { PatternTypes, PatternRecognizer } from '@uprtcl/cortex';
import { GraphQlTypes } from '@uprtcl/common';


export class WikiPage extends reduxConnect(LitElement) {
  async firstUpdated() {

  }

  render() {
    return html`
      
    `;
  }
}
