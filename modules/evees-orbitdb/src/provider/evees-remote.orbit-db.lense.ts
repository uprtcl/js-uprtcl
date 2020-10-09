import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, EveesRemote } from '@uprtcl/evees';

import { EveesOrbitDB } from './evees.orbit-db';

export class RemoteOrbitdDbLense extends moduleConnect(LitElement) {
  @property({ attribute: false })
  loading: boolean = false;

  client!: ApolloClient<any>;
  remote!: EveesOrbitDB;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  async load() {
    this.loading = true;
    this.remote = (this.requestAll(EveesModule.bindings.EveesRemote) as EveesRemote[]).find(r =>
      r.id.includes('orbitdb')
    ) as EveesOrbitDB;
    await this.remote.ready();

    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }
    return html`
      <div class="">
        ODB
      </div>
    `;
  }

  static get styles() {
    return css``;
  }
}
