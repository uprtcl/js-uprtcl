import { MicroOrchestrator, StoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternRegistryModule,
  DiscoveryModule,
  LensesModule,
  LENSES_MODULE_ID
} from '@uprtcl/cortex';

const storeModule = new StoreModule();
const patternRegistryModule = new PatternRegistryModule();
const discoveryModule = new DiscoveryModule();
const lensesModule = new LensesModule();

const orchestrator = MicroOrchestrator.get();

orchestrator.addModules([storeModule, patternRegistryModule, discoveryModule, lensesModule]);

orchestrator.loadModule(LENSES_MODULE_ID);
console.log(orchestrator)