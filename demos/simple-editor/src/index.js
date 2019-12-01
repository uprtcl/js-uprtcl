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

(async function() {
  const c1host = 'http://localhost:3100/uprtcl/1';
  const ethHost = 'ws://localhost:8545';
  const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };

  const httpConnection = new HttpConnection();
  const ipfsConnection = new IpfsConnection(ipfsConfig);
  const ethConnection = new EthereumConnection({ provider: ethHost });

  const httpEvees = new EveesHttp(c1host, httpConnection);
  const ethEvees = new EveesEthereum(ethConnection, ipfsConnection);
  const httpKnownSources = new KnownSourcesHttp(c1host, httpConnection);

  const evees = eveesModule([
    //{ service: httpEvees, knownSources: httpKnownSources },
    { service: ethEvees }
  ]);

  const httpDocuments = new DocumentsHttp(c1host, httpConnection);
  const ipfsDocuments = new DocumentsIpfs(ipfsConnection);

  const documents = documentsModule([
    //{ service: httpDocuments, knownSources: httpKnownSources },
    { service: ipfsDocuments }
  ]);

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
    { id: DocumentsTypes.Module, module: documents }
  );

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
})();
