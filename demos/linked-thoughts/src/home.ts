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

  @query('#help-popper')
  popper!: any;

  @property({ attribute: false })
  home: string | undefined = undefined;

  @property({ attribute: false })
  showNewSpaceForm: boolean = false;

  spaces!: object;

  async firstUpdated() {
    const eveesProvider = this.requestAll(
      EveesModule.bindings.EveesRemote
    ).find((provider: EveesHttp) =>
      provider.id.startsWith('http')
    ) as EveesHttp;

    await eveesProvider.login();

    // this.uprtclHomePerspectives = new EthereumContract(
    //   {
    //     contract: {
    //       abi: abiHome as any,
    //       networks: networksHome,
    //     },
    //   },
    //   this.connection
    // );

    // this.uprtclWrapper = new EthereumContract(
    //   {
    //     contract: {
    //       abi: abiWrapper as any,
    //       networks: networksWrapper,
    //     },
    //   },
    //   this.connection
    // );

    // await this.uprtclHomePerspectives.ready();

    // this.loadAllSpaces();
    // this.loadHome();
  }

  async loadAllSpaces() {
    this.loadingSpaces = true;
    this.spaces = {};
    this.loadingSpaces = false;
  }

  async loadHome() {
    this.loadingHome = true;
    this.home = '';
    this.loadingHome = false;
  }

  async newDocument(title: string) {
    this.creatingNewDocument = true;

    const eveesProvider = this.requestAll(
      EveesModule.bindings.EveesRemote
    ).find((provider: EveesRemote) =>
      provider.id.startsWith('http')
    ) as EveesRemote;

    const client = this.request(
      ApolloClientModule.bindings.Client
    ) as ApolloClient<any>;

    const wiki = {
      title: title,
      pages: [],
    };

    const dataId = await EveesHelpers.createEntity(
      client,
      eveesProvider.store,
      wiki
    );
    const headId = await EveesHelpers.createCommit(
      client,
      eveesProvider.store,
      {
        dataId,
      }
    );

    const perspectiveId = await EveesHelpers.createPerspective(
      client,
      eveesProvider,
      {
        headId: headId,
        context: Date.now().toString(),
      }
    );

    /** create the perspectuve manually to call wrapper createAndSetHome in one tx */
    // const perspectiveData: Perspective = {
    //   creatorId: this.connection.getCurrentAccount(),
    //   authority: eveesProvider.authority,
    //   timestamp: Date.now(),
    // };

    // const perspective: Secured<Perspective> = await deriveSecured(
    //   perspectiveData,
    //   eveesProvider.cidConfig
    // );

    // const newPerspective: NewPerspectiveData = {
    //   perspective,
    //   details: { headId, name: '', context: randint.toString() },
    //   canWrite: this.connection.getCurrentAccount(),
    // };

    // const ethPerspectives = await this.eveesEthereum.preparePerspectives([
    //   newPerspective,
    // ]);

    // await this.uprtclWrapper.ready();
    // await this.uprtclWrapper.send(CREATE_AND_SET_HOME, [
    //   ethPerspectives[0],
    //   this.connection.getCurrentAccount(),
    // ]);

    this.go(perspectiveId);
  }

  async removeSpace() {
    this.removingSpace = true;
    this.removingSpace = false;
    this.firstUpdated();
  }

  go(perspectiveId: string) {
    Router.go(`/doc/${perspectiveId}`);
  }

  renderSpaces() {
    if (this.spaces === undefined) return '';

    const addresses = Object.keys(this.spaces);

    return html`
      <uprtcl-list>
        ${addresses.map((address) => {
          const space = this.spaces[address];
          return html`
            <uprtcl-list-item @click=${() => this.go(space.perspectiveId)}>
              <evees-author user-id=${address}></evees-author>
            </uprtcl-list-item>
          `;
        })}
      </uprtcl-list>
    `;
  }

  render() {
    if (this.switchNetwork) {
      return html` Please make sure you are connected to Rinkeby network `;
    }

    return html`
      ${!this.showNewSpaceForm
        ? html` <img class="background-image" src="/img/home-bg.svg" />
            <div class="button-container">
              ${this.home === undefined || this.home === ''
                ? html` <uprtcl-button
                    @click=${() => (this.showNewSpaceForm = true)}
                    raised
                  >
                    create your space
                  </uprtcl-button>`
                : html`
                    <uprtcl-button @click=${() => this.go(this.home)} raised>
                      go to your space
                    </uprtcl-button>
                    <br />
                    <br />
                    <evees-loading-button
                      label="remove your space"
                      icon="clear"
                      @click=${() => this.removeSpace()}
                      loading=${this.removingSpace}
                    >
                    </evees-loading-button>
                  `}
            </div>`
        : html`<uprtcl-form-string
            value=""
            label="title (optional)"
            ?loading=${this.creatingNewDocument}
            @cancel=${() => (this.showNewSpaceForm = false)}
            @accept=${(e) => this.newDocument(e.detail.value)}
          ></uprtcl-form-string>`}

      <div class="section-title">Recent Spaces</div>
      <div class="spaces-container">
        ${this.renderSpaces()}
      </div>
      <div class="top-right">
        <evees-popper id="help-popper" icon="help_outline">
          <div class="help-content">
            <documents-editor
              ref="zb2rhgWKqjszNprmTEM769G1BgbKisYiiqeP9gnwhWKdVMQeW"
            ></documents-editor>
          </div>
          <uprtcl-button @click=${() => (this.popper.showDropdown = false)}>
            close
          </uprtcl-button>
        </evees-popper>
      </div>
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
    }

    .section-title {
      margin-top: 36px;
      font-weight: bold;
      margin-bottom: 9px;
      color: gray;
    }

    .spaces-container {
      overflow: auto;
      margin-bottom: 36px;
      max-width: 400px;
      margin: 0 auto;
      box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      background-color: rgb(255, 255, 255, 0.7);
      z-index: 2;
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

    .help-content {
      height: 80vh;
      overflow-y: auto;
    }

    .top-right evees-popper {
      --box-width: 80vw;
    }

    .top-right evees-popper uprtcl-button {
      width: 100%;
    }
  `;
}
