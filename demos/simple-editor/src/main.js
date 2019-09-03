import { MicroOrchestrator, StoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternRegistryModule,
  DiscoveryModule,
  LensesModule,
  LENSES_MODULE_ID,
  entitiesReduxModule
} from '@uprtcl/cortex';

const storeModule = new StoreModule();
const patternRegistryModule = new PatternRegistryModule();
const discoveryModule = new DiscoveryModule();
const lensesModule = new LensesModule();
const entitiesReducerModule = entitiesReduxModule();

const orchestrator = MicroOrchestrator.get();

orchestrator.addModules([entitiesReducerModule, storeModule, patternRegistryModule, discoveryModule, lensesModule]);

orchestrator.loadModule(LENSES_MODULE_ID);
