import { StoreModule } from '../packages/micro-orchestrator/dist/lib/modules/redux/store.module.js';
import { PatternRegistryModule } from '../packages/common/dist/common/src/pattern-registry.module.js';
import { DiscoveryModule } from '../packages/common/dist/common/src/pattern-registry.module.js';
import { LensesModule } from '../packages/lenses/dist/lenses/src/lenses.module.js';
import { MicroOrchestrator } from '../packages/micro-orchestrator/dist/lib/uprtcl-micro-orchestrator.js';

const storeModule = new StoreModule();
const patternRegistryModule = new PatternRegistryModule();
const discoveryModule = new DiscoveryModule();
const lensesModule = new LensesModule();

const orchestrator = MicroOrchestrator.get();

orchestrator.addModules([storeModule, patternRegistryModule, discoveryModule, lensesModule]);

orchestrator.loadModule('lenses-module');
