import { LitElement, html, css, property, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect, request } from '@uprtcl/micro-orchestrator';
import {
  EveesModule,
  EveesRemote,
  EveesHelpers,
  EveesEthereum,
} from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';
import { AragonConnector } from '@uprtcl/access-control';

import '@material/mwc-button';
import '@material/mwc-textfield';

import { Router } from '@vaadin/router';

import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { EveesEthereumBinding } from './init';
import { TextType, TextNode } from '@uprtcl/documents';

interface NewNation {
  name: string;
  flag: string;
  constitution: string;
}

export class New extends moduleConnect(LitElement) {
  @property({ attribute: false })
  step: number = 0;

  @property({ attribute: false })
  loading: boolean = false;

  @property({ attribute: false })
  target: number = 0;

  owner: string;
  name: string;
  firstPage: TextNode = { text: 'Article 1', type: TextType.Title, links: [] };

  eveesEthereum: EveesEthereum;
  eveesEthProvider: EveesRemote;
  client: ApolloClient<any>;
  connection: EthereumConnection;

  async firstUpdated() {
    this.eveesEthereum = this.request(EveesEthereumBinding);

    this.eveesEthProvider = this.requestAll(
      EveesModule.bindings.EveesRemote
    ).find((provider: EveesRemote) =>
      provider.authority.startsWith('eth')
    ) as EveesRemote;

    this.client = this.request(
      ApolloClientModule.bindings.Client
    ) as ApolloClient<any>;

    this.connection = (this.eveesEthereum as any).ethConnection;
    await this.connection.ready();
  }

  async newDao(name: string): Promise<string> {
    /** create the perspectuve manually to call wrapper createAndSetHome in one tx */
    const eth: EthereumConnection = this.request('EthereumConnection');
    const aragonConnector = new AragonConnector(eth);
    const daoAddress = await aragonConnector.createDao({
      daoName: name,
      tokenName: 'Citizenship',
      tokenSymbol: 'CTZ',
      members: [eth.getCurrentAccount()],
      votingSettings: ['500000000000000000', '100000000000000000', '86400'],
    });

    console.log('DAO created at', { daoAddress });
    await aragonConnector.connect(daoAddress);
    return aragonConnector.agentAddress;
  }

  async nameSet(name: string) {
    this.loading = true;
    this.name = name;
    this.owner = await this.newDao(name);
    this.step = 2;
    this.loading = false;
  }

  async initConstitution(articleRef: string) {
    /** prepare constitution (with link to the first page)*/
    this.loading = true;
    const constitutionEntityId = await EveesHelpers.createEntity(
      this.client,
      this.eveesEthProvider,
      {
        title: `${this.name} Constitution`,
        pages: [articleRef],
      }
    );

    const constHeadId = await EveesHelpers.createCommit(
      this.client,
      this.eveesEthProvider,
      {
        dataId: constitutionEntityId,
      }
    );

    const randint = 0 + Math.floor((10000 - 0) * Math.random());

    const perspectiveId = await EveesHelpers.createPerspective(
      this.client,
      this.eveesEthProvider,
      {
        headId: constHeadId,
        context: `${name}-wiki-${randint}`,
        canWrite: this.owner,
      }
    );
    this.loading = false;

    Router.go(`/nation/${perspectiveId}`);
  }

  getTarget(target: number) {
    switch (target) {
      case 0:
        return ['Minority', '1M USD'];
      case 1:
        return ['Small City', '10M USD'];
      case 2:
        return ['Small Country', '1B USD'];
      case 3:
        return ['Big Country', '10B USD'];
      case 4:
        return ['World Power', '1T USD'];
    }
  }

  clickTarget() {
    this.target = this.target < 4 ? this.target + 1 : 0;
  }

  renderStep() {
    switch (this.step) {
      case 0:
        return html`<mwc-button @click=${() => (this.step = 1)} raised>
          found a new nation
        </mwc-button>`;

      case 1:
        return html`<evees-string-form
            value=""
            label="Nation's name"
            @cancel=${() => (this.step = 0)}
            @accept=${(e) => this.nameSet(e.detail.value)}
          ></evees-string-form>
          <div class="label">Nation's Treasury</div>
          <mwc-button raised @click=${() => this.clickTarget()}>
            ${this.getTarget(this.target)[0]}<br />
            (${this.getTarget(this.target)[1]})
          </mwc-button>`;

      case 2:
        return html`<documents-editor
          .init=${this.firstPage}
          default-authority=${this.eveesEthProvider.authority}
          @doc-persisted=${(e) => this.initConstitution(e.detail.ref)}
        ></documents-editor>`;
    }
  }

  render() {
    return html`<div class="content">
      ${this.loading
        ? html`<cortex-loading-placeholder></cortex-loading-placeholder> `
        : this.renderStep()}
    </div>`;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: start;
      text-align: center;
      margin-top: 25vh;
    }
    .content {
      margin: 0 auto;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 16px 16px;
      border-radius: 8px;
    }
    .label {
      width: 100%;
      margin-top: 20px;
    }
    documents-editor {
      width: 90vw;
      max-width: 600px;
      --font-family: italiannoregular;
      --font-size: 36px;
    }
    mwc-button {
      width: 220px;
    }
  `;
}
