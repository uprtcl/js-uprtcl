import { ReduxTypes, MicroOrchestrator, ReduxStoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternTypes,
  PatternsModule,
  discoveryModule,
  lensesModule,
  entitiesReduxModule,
  EntitiesTypes,
  DiscoveryTypes,
  LensesTypes,
  actionsPlugin,
  lensSelectorPlugin
} from '@uprtcl/cortex';
import { DocumentsIpfs, documentsModule, DocumentsTypes } from '@uprtcl/documents';
import { KnownSourcesHolochain } from '@uprtcl/connections';
import {
  uprtclModule,
  UprtclEthereum,
  UprtclHolochain,
  UprtclTypes,
  updatePlugin
} from '@uprtcl/common';
import { SimpleEditor } from './simple-editor';

(async function() {
  const ipfsConfig = {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
  };

  const uprtclProvider = new UprtclEthereum('ws://localhost:8545', ipfsConfig);

  const documentsProvider = new DocumentsIpfs(ipfsConfig);

  const knownSources = new KnownSourcesHolochain({
    host: 'ws://localhost:8888',
    instance: 'test-instance'
  });

  const discoverableUprtcl = { service: uprtclProvider, knownSources: knownSources };

  const uprtcl = uprtclModule([discoverableUprtcl]);

  const discoverableDocs = {
    service: documentsProvider,
    knownSources: knownSources
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
