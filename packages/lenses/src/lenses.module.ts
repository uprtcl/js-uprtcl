import { Dictionary } from 'lodash';

import { MicroModule } from '../../micro-orchestrator/src/modules/micro.module';
import { PatternRegistryModule, DiscoveryModule } from '../../common/dist/uprtcl-common.es5';
import { StoreModule } from '../../micro-orchestrator/src/modules/redux/store.module';
import { PatternRenderer } from './elements/pattern-renderer';
import { Store, AnyAction } from 'redux';

export class LensesModule implements MicroModule {
  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {
    const storeModule: StoreModule = dependencies['redux-store'] as StoreModule;
    const patternRegistryModule: PatternRegistryModule = dependencies[
      'pattern-registry'
    ] as PatternRegistryModule;
    const discoveryModule: DiscoveryModule = dependencies['discovery-module'] as DiscoveryModule;

    const patternRenderer = PatternRenderer(
      patternRegistryModule.patternRegistry,
      discoveryModule.discoveryService,
      storeModule.store as Store<any, AnyAction>
    );

    customElements.define('pattern-renderer', patternRenderer);
  }

  async onUnload(): Promise<void> {}

  getDependencies(): string[] {
    return ['pattern-registry', 'discovery-module', 'redux-store'];
  }

  getId(): string {
    return 'lenses-module';
  }
}
