import { MicroOrchestrator, StoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternRegistryModule,
  DiscoveryModule,
  LensesModule,
  LENSES_MODULE_ID,
  entitiesReduxModule
} from '@uprtcl/cortex';
import { DocumentsHolochain } from '@uprtcl/documents';
import { KnownSourcesHolochain } from '@uprtcl/connections';

const storeModule = new StoreModule();
const patternRegistryModule = new PatternRegistryModule();
const discoveryModule = new DiscoveryModule();
const lensesModule = new LensesModule();
const entitiesReducerModule = entitiesReduxModule();

const documentsProvider = new DocumentsHolochain({
  host: 'ws://localhost:8888',
  instance: 'test-instance'
});

const knownSources = new KnownSourcesHolochain({
  host: 'ws://localhost:8888',
  instance: 'test-instance'
});

discoveryModule.discoveryService.addSources({
  source: documentsProvider,
  knownSources: knownSources
});

const orchestrator = MicroOrchestrator.get();

orchestrator.addModules([
  entitiesReducerModule,
  storeModule,
  patternRegistryModule,
  discoveryModule,
  lensesModule
]);

orchestrator.loadModule(LENSES_MODULE_ID);
