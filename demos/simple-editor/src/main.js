import { MicroOrchestrator, StoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternRegistryModule,
  DiscoveryModule,
  LensesModule,
  entitiesReduxModule,
  KnownSourcesDexie,
  CacheDexie
} from '@uprtcl/cortex';
import { DocumentsHolochain, DocumentsModule } from '@uprtcl/documents';
import { KnownSourcesHolochain } from '@uprtcl/connections';
import { UprtclModule, UprtclHolochain } from '@uprtcl/common';
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

const uprtclModule = new UprtclModule({ source: uprtclProvider, knownSources: knownSources });

const documentsModule = new DocumentsModule({
  source: documentsProvider,
  knownSources: knownSources
});
const storeModule = new StoreModule();
const patternRegistryModule = new PatternRegistryModule();
const discoveryModule = new DiscoveryModule(cacheService, localKnownSources);
const lensesModule = new LensesModule();
const entitiesReducerModule = entitiesReduxModule();

const orchestrator = MicroOrchestrator.get();

orchestrator
  .loadModules(
    storeModule,
    entitiesReducerModule,
    patternRegistryModule,
    discoveryModule,
    lensesModule,
    uprtclModule,
    documentsModule
  )
  .then(() => {
    customElements.define('simple-editor', SimpleEditor(patternRegistryModule.patternRegistry));
  });
