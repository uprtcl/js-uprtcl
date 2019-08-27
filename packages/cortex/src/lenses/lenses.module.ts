import { Dictionary } from 'lodash';
import { Store, AnyAction } from 'redux';

import { StoreModule, MicroModule, REDUX_STORE_ID } from '@uprtcl/micro-orchestrator';
import { PatternRenderer } from './pattern-renderer';
import { lenses } from './lenses';
import { DiscoveryModule, DISCOVERY_MODULE_ID } from '../services/discovery.module';
import { PatternRegistryModule, PATTERN_REGISTRY_MODULE_ID } from '../patterns/pattern-registry.module';
import { entitiesReducerName } from '../entities/entities.selectors';

export const LENSES_MODULE_ID = 'lenses-module';

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

    Object.entries(lenses).forEach(([tag, lens]) => {
      customElements.define(tag, lens);
    });
  }

  async onUnload(): Promise<void> {}

  getDependencies(): string[] {
    return [PATTERN_REGISTRY_MODULE_ID, DISCOVERY_MODULE_ID, entitiesReducerName];
  }

  getId(): string {
    return LENSES_MODULE_ID;
  }
}
