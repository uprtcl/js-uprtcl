import { LitElement, html, css, property, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect, request } from '@uprtcl/micro-orchestrator';
import {
  EveesModule,
  EveesRemote,
  EveesHelpers,
  EveesEthereum,
  Secured,
  deriveSecured,
} from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';

import '@material/mwc-button';
import '@authentic/mwc-circular-progress';

import { Router } from '@vaadin/router';

import {
  EthereumConnection,
  EthereumContract,
} from '@uprtcl/ethereum-provider';

import {
  abi as abiHome,
  networks as networksHome,
} from './contracts-json/UprtclHomePerspectives.min.json';
import {
  abi as abiWrapper,
  networks as networksWrapper,
} from './contracts-json/UprtclWrapper.min.json';

import { EveesEthereumBinding } from './init';
import {
  NewPerspectiveData,
  Perspective,
} from '@uprtcl/evees/dist/types/types';
import { getHomePerspective, CREATE_AND_SET_HOME, SET_HOME } from './support';

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

  eveesEthereum: EveesEthereum;
  connection: EthereumConnection;

  spaces!: object;

  uprtclHomePerspectives: EthereumContract;
  uprtclWrapper: EthereumContract;

  async firstUpdated() {
    this.eveesEthereum = this.request(EveesEthereumBinding);
    this.connection = (this.eveesEthereum as any).ethConnection;
    await this.connection.ready();

    // if ([1, 3, 42].includes(this.connection.networkId)) {
    //   this.switchNetwork = true;
    //   return;
    // }

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
    const events = await this.uprtclHomePerspectives.contractInstance.getPastEvents(
      'HomePerspectiveSet',
      {
        fromBlock: 0,
      }
    );

    this.spaces = {};
    for (const event of events) {
      const address = event.returnValues.owner.toLowerCase();
      this.spaces[address] = {
        perspectiveId: event.returnValues.perspectiveId,
      };
    }
    this.loadingSpaces = false;
  }

  async loadHome() {
    this.loadingHome = true;
    this.home = await getHomePerspective(
      this.uprtclHomePerspectives.contractInstance,
      this.connection.getCurrentAccount()
    );
    this.loadingHome = false;
  }

  async newDocument(title: string) {
    this.creatingNewDocument = true;

    const eveesProvider = this.requestAll(
      EveesModule.bindings.EveesRemote
    ).find((provider: EveesRemote) =>
      provider.authority.startsWith('http')
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
      eveesProvider,
      wiki
    );
    const headId = await EveesHelpers.createCommit(client, eveesProvider, {
      dataId,
    });

    const perspectiveId = await EveesHelpers.createPerspective(client, eveesProvider, {
      headId: headId, context: 'test123'
    });

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
    await this.uprtclHomePerspectives.send(SET_HOME, ['']);
    this.removingSpace = false;
    this.firstUpdated();
  }

  go(perspectiveId: string) {
    Router.go(`/doc/${perspectiveId}`);
  }

  renderSpaces() {
    if (this.spaces === undefined) return '';

    const addresses = Object.keys(this.spaces).filter(
      (address) =>
        address !== this.connection.getCurrentAccount() &&
        this.spaces[address].perspectiveId !== ''
    );

    return html`
      <mwc-list>
        ${addresses.map((address) => {
          const space = this.spaces[address];
          return html`
            <mwc-list-item @click=${() => this.go(space.perspectiveId)}>
              <evees-author user-id=${address}></evees-author>
            </mwc-list-item>
          `;
        })}
      </mwc-list>
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
                ? html` <mwc-button
                    @click=${() => (this.showNewSpaceForm = true)}
                    raised
                  >
                    create your space
                  </mwc-button>`
                : html`
                    <mwc-button @click=${() => this.go(this.home)} raised>
                      go to your space
                    </mwc-button>
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
        : html`<evees-string-form
            value=""
            label="title (optional)"
            ?loading=${this.creatingNewDocument}
            @cancel=${() => (this.showNewSpaceForm = false)}
            @accept=${(e) => this.newDocument(e.detail.value)}
          ></evees-string-form>`}

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
          <mwc-button @click=${() => (this.popper.showDropdown = false)}>
            close
          </mwc-button>
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

    evees-string-form {
      width: fit-content;
      margin: 0 auto;
    }

    mwc-button {
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

    .top-right evees-popper mwc-button {
      width: 100%;
    }
  `;
}
