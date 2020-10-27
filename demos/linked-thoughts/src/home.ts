import { LitElement, html, css, property, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesModule, EveesRemote, EveesHelpers } from '@uprtcl/evees';

import { EveesHttp } from '@uprtcl/evees-http';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Router } from '@vaadin/router';

export class Home extends moduleConnect(LitElement) {
  @property({ attribute: false })
  loadingSpaces: boolean = true;

  @property({ attribute: false })
  loadingHome: boolean = true;

  @property({ attribute: false })
  creatingNewDocument: boolean = false;

  @property({ attribute: false })
  removingSpace: boolean = false;

  @property({ attribute: false })
  switchNetwork: boolean = false;

  @property({ attribute: false })
  home: string | undefined = undefined;

  @property({ attribute: false })
  showNewSpaceForm: boolean = false;

  spaces!: object;

  async firstUpdated() {
    const eveesProvider = this.requestAll(
      EveesModule.bindings.EveesRemote
    ).find((provider: EveesHttp) => provider.id.startsWith('http')) as EveesHttp;

    await eveesProvider.login();
  }

  async newDocument(title: string) {
    this.creatingNewDocument = true;

    const remote = this.requestAll(EveesModule.bindings.EveesRemote).find((provider: EveesRemote) =>
      provider.id.startsWith('http')
    ) as EveesRemote;

    const perspective = await remote.getHome(remote.userId);
    const id = await remote.store.create(perspective.object);

    if (id !== perspective.id) {
      throw new Error('unexpected id');
    }

    this.go(perspective.id);
  }

  go(perspectiveId: string) {
    Router.go(`/doc/${perspectiveId}`);
  }

  render() {
    if (this.switchNetwork) {
      return html`
        Please make sure you are connected to Rinkeby network
      `;
    }

    return html`
      ${!this.showNewSpaceForm
        ? html`
            <img class="background-image" src="/img/home-bg.svg" />
            <div class="button-container">
              <uprtcl-button @click=${() => (this.showNewSpaceForm = true)} raised>
                create your space
              </uprtcl-button>
            </div>
          `
        : html`
            <uprtcl-form-string
              value=""
              label="title (optional)"
              ?loading=${this.creatingNewDocument}
              @cancel=${() => (this.showNewSpaceForm = false)}
              @accept=${e => this.newDocument(e.detail.value)}
            ></uprtcl-form-string>
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
      height: 80vh;
      padding: 10vh 10px;
    }

    uprtcl-form-string {
      width: fit-content;
      margin: 0 auto;
    }

    uprtcl-button {
      width: 220px;
      margin: 0 auto;
    }

    .background-image {
      position: fixed;
      bottom: -71px;
      right: -67px;
      z-index: 0;
      width: 60vw;
      max-width: 600px;
      min-width: 400px;
    }

    .top-right {
      position: fixed;
      top: 6px;
      right: 6px;
      z-index: 3;
    }

    .top-right evees-popper {
      --box-width: 80vw;
    }

    .top-right evees-popper uprtcl-button {
      width: 100%;
    }
  `;
}
