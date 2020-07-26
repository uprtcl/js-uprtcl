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
import { TextType } from '@uprtcl/documents';

interface NewNation {
  name: string;
  flag: string;
  constitution: string;
}

export class New extends moduleConnect(LitElement) {
  @property({ attribute: false })
  loadingHome: boolean = true;

  @property({ attribute: false })
  creatingNewNation: boolean = false;

  @property({ attribute: false })
  step: number = 0;

  owner: string;
  name: string;
  articleRef: string;

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

  async newPerspective(
    data: any,
    context: string,
    owner: string
  ): Promise<string> {
    const dataId = await EveesHelpers.createEntity(
      this.client,
      this.eveesEthProvider,
      data
    );
    const headId = await EveesHelpers.createCommit(
      this.client,
      this.eveesEthProvider,
      {
        dataId,
      }
    );
    const perspectiveId = await EveesHelpers.createPerspective(
      this.client,
      this.eveesEthProvider,
      {
        headId,
        context,
        canWrite: owner,
      }
    );
    return perspectiveId;
  }

  async nameSet(name: string) {
    this.creatingNewNation = true;

    const randint = 0 + Math.floor((1000000000 - 0) * Math.random());

    const owner = await this.newDao(nation.name);
  }

  async initConstitution(name: string) {
    const ids = await this.newPerspectives(
      [{ text: 'Article 1', type: TextType.Paragraph, links: [] },
      `${name}-article-1`,
      this.owner
    );
  }

  renderStep() {
    switch (this.step) {
      case 0:
        return html`<mwc-button
          @click=${() => (this.step = 1)}
          raised
        >
          found a new nation
        </mwc-button>`;

      case 1:
        return html`<evees-string-form
        value=""
        label="name of the nation"
        ?loading=${this.creatingDao}
        @cancel=${() => (this.step = 0)}
        @accept=${(e) => this.nameSet(e.detail.value)}
      ></evees-string-form>`;
          }
  }

  render() {
    return html`<div>${this.renderStep()}</div>`;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
    mwc-textfield {
      width: 400px;
    }
    mwc-button {
      width: 220px;
    }
  `;
}
