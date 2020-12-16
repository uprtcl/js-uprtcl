import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, EveesRemote } from '@uprtcl/evees';

import { EveesOrbitDB } from './evees.orbit-db';

export class RemoteOrbitdDbLense extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  client!: ApolloClient<any>;
  remote!: EveesOrbitDB;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  async load() {
    this.loading = true;
    const remotes = this.requestAll(
      EveesModule.bindings.EveesRemote
    ) as EveesRemote[];
    this.remote = remotes.find((r) =>
      r.id.includes(this.remoteId)
    ) as EveesOrbitDB;
    await this.remote.ready();

    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }
    return html`
      <evees-author
        user-id=${this.remote.userId as string}
        remote-id=${this.remote.id}
      ></evees-author>
    `;
  }

  static get styles() {
    return css``;
  }
}
