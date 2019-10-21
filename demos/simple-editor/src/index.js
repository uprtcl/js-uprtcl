import { ReduxTypes, MicroOrchestrator, StoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternTypes,
  PatternsModule,
  discoveryModule,
  LensesModule,
  entitiesReduxModule,
  EntitiesTypes,
  DiscoveryTypes,
  LensesTypes
} from '@uprtcl/cortex';
import { DocumentsHolochain, documentsModule, DocumentsTypes } from '@uprtcl/documents';
import { KnownSourcesHolochain } from '@uprtcl/connections';
import { uprtclModule, UprtclHolochain, UprtclTypes } from '@uprtcl/common';
import { SimpleEditor } from './simple-editor';

window.Buffer = window.Buffer || require('buffer').Buffer;

(async function() {
  const uprtclProvider = new UprtclHolochain({
    host: 'ws://localhost:8888',
    instance: 'test-instance'
  });

  const documentsProvider = new DocumentsHolochain({
    host: 'ws://localhost:8888',
    instance: 'test-instance'
  });

  const knownSources = new KnownSourcesHolochain({
    host: 'ws://localhost:8888',
    instance: 'test-instance'
  });

  const discoverableUprtcl = { source: uprtclProvider, knownSources: knownSources };
  const uprtcl = uprtclModule([discoverableUprtcl]);

  const discoverableDocs = {
    source: documentsProvider,
    knownSources: knownSources
  };
  const documents = documentsModule([discoverableDocs]);

  const discovery = discoveryModule();
  const entitiesReducerModule = entitiesReduxModule();

  const orchestrator = new MicroOrchestrator();

  await orchestrator.loadModules(
    { id: ReduxTypes.Module, module: StoreModule },
    { id: EntitiesTypes.Module, module: entitiesReducerModule },
    { id: PatternTypes.Module, module: PatternsModule },
    { id: DiscoveryTypes.Module, module: discovery },
    { id: LensesTypes.Module, module: LensesModule },
    { id: UprtclTypes.Module, module: uprtcl },
    { id: DocumentsTypes.Module, module: documents }
  );

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
})();
