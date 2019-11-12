import { ReduxTypes, MicroOrchestrator, ReduxStoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternTypes,
  PatternsModule,
  discoveryModule,
  DiscoveryTypes,
  LensesTypes
} from '@uprtcl/cortex';
import { lensesModule, actionsPlugin, updatePlugin, lensSelectorPlugin } from '@uprtcl/lenses';
import { DocumentsIpfs, documentsModule, DocumentsTypes } from '@uprtcl/documents';
import { KnownSourcesHolochain, IpfsConnection, EthereumConnection } from '@uprtcl/connections';
import {
  AccessControlTypes,
  AccessControlReduxModule,
  EntitiesReduxModule,
  EntitiesTypes,
  AuthTypes,
  AuthReduxModule
} from '@uprtcl/common';
import { eveesModule, EveesEthereum, EveesHolochain, EveesTypes } from '@uprtcl/evees';
import { SimpleEditor } from './simple-editor';

(async function() {
  const ipfsConnection = new IpfsConnection({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
  });

  const ethConnection = new EthereumConnection({ provider: 'ws://localhost:8545' });

  const eveesProvider = new EveesEthereum(ethConnection, ipfsConnection);

  const documentsProvider = new DocumentsIpfs(ipfsConnection);

  const discoverableEvees = { service: eveesProvider };

  const evees = eveesModule([discoverableEvees]);

  const discoverableDocs = {
    service: documentsProvider
  };
  const documents = documentsModule([discoverableDocs]);

  const orchestrator = new MicroOrchestrator();

  await orchestrator.loadModules(
    { id: ReduxTypes.Module, module: ReduxStoreModule },
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
