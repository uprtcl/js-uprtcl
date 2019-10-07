import { MicroOrchestrator, StoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternsModule,
  discoveryModule,
  LensesModule,
  entitiesReduxModule,
  KnownSourcesDexie,
  CacheDexie
} from '@uprtcl/cortex';
import { DocumentsHolochain, documentsModule } from '@uprtcl/documents';
import { KnownSourcesHolochain } from '@uprtcl/connections';
import { uprtclModule, UprtclHolochain } from '@uprtcl/common';
import { SimpleEditor } from './simple-editor';

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

const localKnownSources = new KnownSourcesDexie();
const cacheService = new CacheDexie();

const discoverableUprtcl = { source: uprtclProvider, knownSources: knownSources };
const uprtcl = uprtclModule(discoverableUprtcl);

const discoverableDocs = {
  source: documentsProvider,
  knownSources: knownSources
};
const documents = documentsModule(discoverableDocs);

const discovery = discoveryModule(cacheService, localKnownSources, [
  discoverableUprtcl,
  discoverableDocs
]);
const entitiesReducerModule = entitiesReduxModule();

const orchestrator = new MicroOrchestrator();

orchestrator
  .loadModules(
    StoreModule,
    entitiesReducerModule,
    documents,
    PatternsModule,
    LensesModule,
    uprtcl,
    discovery
  )
  .then(() => {
    console.log(orchestrator);
    customElements.define('simple-editor', SimpleEditor);
  });
