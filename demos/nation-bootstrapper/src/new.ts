import { LitElement, html, css, property, query } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect, request } from '@uprtcl/micro-orchestrator';
import {
  EveesModule,
  EveesRemote,
  EveesHelpers,
  EveesEthereum,
  Perspective,
  deriveSecured,
  Secured,
  NewPerspectiveData,
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
  step: number = 2;

  @property({ attribute: false })
  loading: boolean = true;

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
    return '0x0';
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
    const owner = await this.newDao(name);
    this.step = 2;
    this.loading = false;
  }

  async initConstitution(name: string) {
    /** prepare first page */
    const pageEntityId = await EveesHelpers.createEntity(
      this.client,
      this.eveesEthProvider,
      this.firstPage
    );

    const pageHeadId = await EveesHelpers.createCommit(
      this.client,
      this.eveesEthProvider,
      {
        dataId: pageEntityId,
      }
    );

    const pagePerspective: Perspective = {
      creatorId: this.connection.getCurrentAccount(),
      authority: this.eveesEthProvider.authority,
      timestamp: Date.now(),
    };

    const pageSecured: Secured<Perspective> = await deriveSecured(
      pagePerspective,
      this.eveesEthProvider.cidConfig
    );

    const newPagePerspective: NewPerspectiveData = {
      perspective: pageSecured,
      details: { headId: pageHeadId, context: `${name}-1` },
      canWrite: this.owner,
    };

    /** prepare constitution (with link to the first page)*/
    const constitutionEntityId = await EveesHelpers.createEntity(
      this.client,
      this.eveesEthProvider,
      {
        title: `${name} Constitution`,
        type: TextType.Title,
        links: [pageSecured.id],
      }
    );

    const constHeadId = await EveesHelpers.createCommit(
      this.client,
      this.eveesEthProvider,
      {
        dataId: constitutionEntityId,
      }
    );

    const constitutionPerspective: Perspective = {
      creatorId: this.connection.getCurrentAccount(),
      authority: this.eveesEthProvider.authority,
      timestamp: Date.now(),
    };

    const constitutionSecured: Secured<Perspective> = await deriveSecured(
      constitutionPerspective,
      this.eveesEthProvider.cidConfig
    );

    const newConstitutionPerspective: NewPerspectiveData = {
      perspective: constitutionSecured,
      details: { headId: constHeadId, context: `${name}-1` },
      canWrite: this.owner,
    };

    /** create both perspective owned by the DAO in a single tx */

    this.eveesEthProvider.createPerspectiveBatch([
      newPagePerspective,
      newConstitutionPerspective,
    ]);
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
          label="name of the nation"
          @cancel=${() => (this.step = 0)}
          @accept=${(e) => this.nameSet(e.detail.value)}
        ></evees-string-form>`;

      case 2:
        return html`<documents-editor
          .init=${this.firstPage}
        ></documents-editor>`;
    }
  }

  render() {
    return html`<div class="content">${this.renderStep()}</div>`;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
    .content {
      margin: 0 auto;
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
