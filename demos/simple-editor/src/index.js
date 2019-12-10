import { ReduxTypes, MicroOrchestrator, ReduxStoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternTypes,
  PatternsModule,
  discoveryModule,
  DiscoveryTypes,
  LensesTypes
} from '@uprtcl/cortex';
import { lensesModule, actionsPlugin, updatePlugin, lensSelectorPlugin } from '@uprtcl/lenses';
import { DocumentsHttp, DocumentsIpfs, documentsModule, DocumentsTypes } from '@uprtcl/documents';
import { WikisIpfs, wikisModule, WikisTypes, WikisHttp } from '@uprtcl/wikis';
import {
  ApolloClientModule,
  GraphQlTypes,
  AccessControlTypes,
  AccessControlReduxModule,
  EntitiesReduxModule,
  EntitiesTypes,
  AuthTypes,
  AuthReduxModule
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

  const ipfsDocuments = new DocumentsIpfs(ipfsConnection);

  const documents = documentsModule([ipfsDocuments]);

  const httpWikis = new WikisHttp(c1host, httpConnection);
  const ipfsWikis = new WikisIpfs(ipfsConnection);

  const wikis = wikisModule([ipfsWikis, httpWikis]);

  const orchestrator = new MicroOrchestrator();

  await orchestrator.loadModules(
    { id: ReduxTypes.Module, module: ReduxStoreModule },
    { id: GraphQlTypes.Module, module: ApolloClientModule },
    { id: PatternTypes.Module, module: PatternsModule },
    { id: DiscoveryTypes.Module, module: discoveryModule() },
    { id: EntitiesTypes.Module, module: EntitiesReduxModule },
    { id: AccessControlTypes.Module, module: AccessControlReduxModule },
    { id: AuthTypes.Module, module: AuthReduxModule },
    {
      id: LensesTypes.Module,
      module: lensesModule([updatePlugin(), lensSelectorPlugin(), actionsPlugin()])
    },
    { id: EveesTypes.Module, module: evees },
    { id: DocumentsTypes.Module, module: documents },
    { id: WikisTypes.Module, module: wikis }
  );

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
  customElements.define('simple-wiki', SimpleWiki);
})();
