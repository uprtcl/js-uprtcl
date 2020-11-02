import { LitElement, html, css, property, internalProperty } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, EveesRemote } from '@uprtcl/evees';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { Router } from '@vaadin/router';

export class CouncilSpace extends moduleConnect(LitElement) {
  logger = new Logger('Account space');

  @internalProperty()
  perspectiveId!: string;

  @internalProperty()
  loading: boolean = true;

  client!: any;
  remote!: EveesRemote;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.remote = (this.request(EveesModule.bindings.Config) as any).officialRemote;
    await this.remote.ready();

    this.load();
  }

  async load() {
    this.loading = true;

    const homePerspective = await this.remote.getHome();
    await this.remote.store.create(homePerspective.object);
    this.perspectiveId = homePerspective.id;

    this.logger.log(`Home perspective ${this.perspectiveId} found`);

    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    return html`
      <wiki-drawer
        uref=${this.perspectiveId}
        show-back
        show-proposals
        check-owner
        @back=${() => Router.go(`/`)}
      ></wiki-drawer>
    `;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      text-align: center;
    }
  `;
}
