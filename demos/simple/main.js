import {
  MicroOrchestrator,
  StoreModule
} from '@uprtcl/micro-orchestrator';
import {
  PatternRegistryModule,
  DiscoveryModule
} from '@uprtcl/common';
import { LensesModule } from '@uprtcl/lenses';

const storeModule = new StoreModule();
const patternRegistryModule = new PatternRegistryModule();
const discoveryModule = new DiscoveryModule();
const lensesModule = new LensesModule();

const orchestrator = MicroOrchestrator.get();

orchestrator.addModules([storeModule, patternRegistryModule, discoveryModule, lensesModule]);

orchestrator.loadModule('lenses-module');
