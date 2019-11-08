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
import { KnownSourcesHolochain } from '@uprtcl/connections';
import {
  AccessControlTypes,
  accessControlReduxModule,
  entitiesReduxModule,
  EntitiesTypes
} from '@uprtcl/common';
import { eveesModule, UprtclEthereum, UprtclHolochain, UprtclTypes } from '@uprtcl/evees';
import { SimpleEditor } from './simple-editor';

(async function() {
  const ipfsConfig = {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
  };

  const uprtclProvider = new UprtclEthereum('ws://localhost:8545', ipfsConfig);

  const documentsProvider = new DocumentsIpfs(ipfsConfig);

  const discoverableUprtcl = { service: uprtclProvider };

  const uprtcl = eveesModule([discoverableUprtcl]);

  const discoverableDocs = {
    service: documentsProvider
  };
  const documents = documentsModule([discoverableDocs]);

  const discovery = discoveryModule();
  const entitiesReducerModule = entitiesReduxModule();

  const orchestrator = new MicroOrchestrator();

  await orchestrator.loadModules(
    { id: ReduxTypes.Module, module: ReduxStoreModule },
    { id: EntitiesTypes.Module, module: entitiesReducerModule },
    { id: PatternTypes.Module, module: PatternsModule },
    { id: DiscoveryTypes.Module, module: discovery },
    { id: AccessControlTypes.Module, module: accessControlReduxModule() },
    {
      id: LensesTypes.Module,
      module: lensesModule([updatePlugin(), lensSelectorPlugin(), actionsPlugin()])
    },
    { id: UprtclTypes.Module, module: uprtcl },
    { id: DocumentsTypes.Module, module: documents }
  );

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
})();
