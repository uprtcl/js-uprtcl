import { ApolloClient } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { UpdateRequest } from '../types';

export class UpdatedDiff extends moduleConnect(LitElement) {

  logger = new Logger('EVEES-DIFF');

  @property({ type: Array, attribute: 'head-updates' })
  headUpdates: UpdateRequest[] = [];

  protected client: ApolloClient<any> | undefined = undefined;

  async firstUpdated() {
    this.logger.log('firstUpdated()', { headUpdates: this.headUpdates });
    this.client = this.request(ApolloClientModule.bindings.Client);
  }

  async updated(changedProperties) {
    this.logger.log('updated()', { headUpdates: this.headUpdates, changedProperties });
  }

  render() {
    return this.headUpdates.map(update => html`<div>${update.newHeadId}</div>`);
  }

  static get styles() {
    return css``;
  }
}
