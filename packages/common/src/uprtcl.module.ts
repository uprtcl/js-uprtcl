import { MicroModule, REDUX_STORE_ID, StoreModule } from '@uprtcl/micro-orchestrator';
import {
  PATTERN_REGISTRY_MODULE_ID,
  DISCOVERY_MODULE_ID,
  PatternRegistryModule,
  SecuredPattern,
  Secured,
  Pattern,
  DiscoverableSource,
  DiscoveryModule
} from '@uprtcl/cortex';
import { Dictionary } from 'lodash';
import { UprtclProvider } from './services/uprtcl/uprtcl.provider';
import { PerspectivePattern } from './patterns/perspective.pattern';
import { CommitPattern } from './patterns/commit.pattern';
import { ContextPattern } from './patterns/context.pattern';
import { CommitHistory } from './lenses/commit-history';

export const UPRTCL_MODULE_ID = 'uprtcl-module';

export class UprtclModule implements MicroModule {
  constructor(protected discoverableUprtcl: DiscoverableSource<UprtclProvider>) {}

  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {
    const patternRegistryModule: PatternRegistryModule = dependencies[
      PATTERN_REGISTRY_MODULE_ID
    ] as PatternRegistryModule;

    const discoveryModule: DiscoveryModule = dependencies[DISCOVERY_MODULE_ID] as DiscoveryModule;
    discoveryModule.discoveryService.addSources(this.discoverableUprtcl);

    const patternRegistry = patternRegistryModule.patternRegistry;
    const securedPattern: Pattern & SecuredPattern<Secured<any>> = patternRegistry.getPattern(
      'secured'
    );

    const perspectivePattern = new PerspectivePattern(
      patternRegistry,
      securedPattern,
      this.discoverableUprtcl.source
    );
    const commitPattern = new CommitPattern(
      patternRegistry,
      securedPattern,
      perspectivePattern,
      discoveryModule.discoveryService,
      this.discoverableUprtcl.source
    );
    const contextPattern = new ContextPattern(securedPattern, this.discoverableUprtcl.source);

    patternRegistry.registerPattern('commit', commitPattern);
    patternRegistry.registerPattern('perspective', perspectivePattern);
    patternRegistry.registerPattern('context', contextPattern);

    const storeModule: StoreModule = dependencies[REDUX_STORE_ID] as StoreModule;

    customElements.define(
      'commit-history',
      CommitHistory(discoveryModule.discoveryService, storeModule.store)
    );
  }

  async onUnload(): Promise<void> {}

  getDependencies(): string[] {
    return [PATTERN_REGISTRY_MODULE_ID, DISCOVERY_MODULE_ID, REDUX_STORE_ID];
  }

  getId(): string {
    return UPRTCL_MODULE_ID;
  }
}
