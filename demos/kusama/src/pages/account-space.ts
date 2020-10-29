import { LitElement, html, css, property, internalProperty } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { EveesModule, EveesRemote } from '@uprtcl/evees';

import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class AccountSpace extends moduleConnect(LitElement) {
  logger = new Logger('Account space');

  @internalProperty()
  perspectiveId!: string;

  @internalProperty()
  loading: boolean = true;

  @internalProperty()
  isLogged: boolean = true;

  client!: any;
  defaultRemote!: EveesRemote;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.defaultRemote = (this.request(EveesModule.bindings.Config) as any).defaultRemote;
    await this.defaultRemote.ready();

    this.load();
  }

  async load() {
    this.loading = true;
    if (await this.defaultRemote.isLogged()) {
      this.isLogged = false;
      this.loading = false;
      return;
    }

    const homePerspective = await this.defaultRemote.getHome(this.defaultRemote.userId);
    await this.defaultRemote.store.create(homePerspective.object);
    this.perspectiveId = homePerspective.id;

    this.logger.log(
      `Home perspective ${this.perspectiveId} found for user ${this.defaultRemote.userId}`
    );

    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    return html`
      ${!this.isLogged
        ? html`
            <uprtcl-button>login</uprtcl-button>
          `
        : html`
            <wiki-drawer uref=${this.perspectiveId}></wiki-drawer>
          `}
    `;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      text-align: center;
      //height: 80vh;
      //padding: 10vh 10px;
    }
  `;
}
