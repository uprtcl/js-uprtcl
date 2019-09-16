import { MicroOrchestrator, StoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternRegistryModule,
  DiscoveryModule,
  LensesModule,
  LENSES_MODULE_ID,
  entitiesReduxModule,
  KnownSourcesDexie,
  CacheDexie
} from '@uprtcl/cortex';
import { DocumentsHolochain, DocumentsModule } from '@uprtcl/documents';
import { KnownSourcesHolochain } from '@uprtcl/connections';
import { SimpleEditor } from './simple-editor';

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

const documentsModule = new DocumentsModule({ source: documentsProvider, knownSources: knownSources });
const storeModule = new StoreModule();
const patternRegistryModule = new PatternRegistryModule();
const discoveryModule = new DiscoveryModule(cacheService, localKnownSources);
const lensesModule = new LensesModule();
const entitiesReducerModule = entitiesReduxModule();

const orchestrator = MicroOrchestrator.get();

orchestrator.loadModules(
  storeModule,
  entitiesReducerModule,
  patternRegistryModule,
  discoveryModule,
  lensesModule,
  documentsModule
).then(()=> {
  customElements.define('simple-editor', SimpleEditor(patternRegistryModule.patternRegistry));
});

