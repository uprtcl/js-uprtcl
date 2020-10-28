import { LitElement, html, css, property, query } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesModule, EveesHelpers, deriveSecured, hashObject } from '@uprtcl/evees';
import { Router } from '@vaadin/router';
import { ApolloClientModule } from '@uprtcl/graphql';

export class Home extends moduleConnect(LitElement) {
  private remote: any;

  async firstUpdated() {
    this.remote = this.requestAll(EveesModule.bindings.EveesRemote).find((instance: any) =>
      instance.id.includes('council')
    );
  }

  async onAccountSpaceClick() {
    const client: any = this.request(ApolloClientModule.bindings.Client);

    const randint = 0 + Math.floor((10000 - 0) * Math.random());
    const wiki = {
      title: `Genesis Wiki ${randint}`,
      pages: []
    };

    await this.remote.ready();
    const dataId = await EveesHelpers.createEntity(client, this.remote.store, wiki);
    const headId = await EveesHelpers.createCommit(client, this.remote.store, {
      dataId
    });

    const perspectiveId = await EveesHelpers.createPerspective(client, this.remote, {
      headId,
      context: `my-wiki-${randint}`
    });
    Router.go(`/account/${perspectiveId}`);
  }

  async onCouncilSpaceClick() {
    Router.go(`/council`);
  }

  render() {
    return html`
      <a @click=${this.onCouncilSpaceClick} href="/council">
        <button>Council Space</button>
      </a>
      <a @click=${this.onAccountSpaceClick}>
        <button>Your Space</button>
      </a>
    `;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      text-align: center;
      height: 80vh;
      padding: 10vh 10px;
    }
  `;
}
