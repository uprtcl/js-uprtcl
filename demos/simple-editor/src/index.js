import {
  MicroOrchestrator,
  ReduxStoreModule,
  i18nTypes
} from '@uprtcl/micro-orchestrator';
import {
  CortexTypes,
  PatternsModule,
  discoveryModule,
  DiscoveryTypes,
  LensesTypes,
  CortexModule
} from '@uprtcl/cortex';
import { lensesModule, LensSelectorPlugin, ActionsPlugin, UpdatablePlugin } from '@uprtcl/lenses';
import { DocumentsHttp, DocumentsIpfs, documentsModule, DocumentsTypes } from '@uprtcl/documents';
import { WikisIpfs, wikisModule, WikisTypes, WikisHttp } from '@uprtcl/wikis';
import {
  ApolloClientModule,
  GraphQlTypes,
  i18nextBaseModule
} from '@uprtcl/common';
import { eveesModule, EveesEthereum, EveesHttp, EveesTypes } from '@uprtcl/evees';
import {
  KnownSourcesHttp,
  IpfsConnection,
  EthereumConnection,
  HttpConnection
} from '@uprtcl/connections';
import { SimpleEditor } from './simple-editor';
import { SimpleWiki } from './simple-wiki';

(async function() {
  const c1host = 'http://localhost:3100/uprtcl/1';
  const ethHost = 'ws://localhost:8545';
  const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };

  const httpConnection = new HttpConnection();
  const ipfsConnection = new IpfsConnection(ipfsConfig);
  const ethConnection = new EthereumConnection({ provider: ethHost });

  const httpEvees = new EveesHttp(c1host, httpConnection);
  const ethEvees = new EveesEthereum(ethConnection, ipfsConnection);

  const evees = eveesModule([httpEvees, ethEvees]);

  const httpDocuments = new DocumentsHttp(c1host, httpConnection);
  const ipfsDocuments = new DocumentsIpfs(ipfsConnection);

  const documents = documentsModule([ipfsDocuments, httpDocuments]);

  const httpWikis = new WikisHttp(c1host, httpConnection);
  const ipfsWikis = new WikisIpfs(ipfsConnection);

  const wikis = wikisModule([ipfsWikis, httpWikis]);

  const lenses = lensesModule([
    { name: 'lens-selector', plugin: new LensSelectorPlugin() },
    { name: 'actions', plugin: new ActionsPlugin() },
    { name: 'updatable', plugin: new UpdatablePlugin() }
  ]);

  const modules = {
    [i18nTypes.Module]: i18nextBaseModule,
    [GraphQlTypes.Module]: ApolloClientModule,
    [CortexTypes.Module]: CortexModule,
    [DiscoveryTypes.Module]: discoveryModule(),
    [LensesTypes.Module]: lenses,
    [EveesTypes.Module]: evees,
    [DocumentsTypes.Module]: documents,
    [WikisTypes.Module]: wikis
  };

  const orchestrator = new MicroOrchestrator();

  await orchestrator.loadModules(modules);

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
  customElements.define('simple-wiki', SimpleWiki);
})();
