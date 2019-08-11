import {
  PatternRegistryModule,
  DiscoveryModule
} from '../packages/common/dist/uprtcl-common.es5.js';
import { LensesModule } from '../packages/lenses/dist/uprtcl-lenses.es5.js';
import {
  MicroOrchestrator,
  StoreModule
} from '../packages/micro-orchestrator/dist/micro-orchestrator.es5.js';

const storeModule = new StoreModule();
const patternRegistryModule = new PatternRegistryModule();
const discoveryModule = new DiscoveryModule();
const lensesModule = new LensesModule();

const orchestrator = MicroOrchestrator.get();

orchestrator.addModules([storeModule, patternRegistryModule, discoveryModule, lensesModule]);

orchestrator.loadModule('lenses-module');
