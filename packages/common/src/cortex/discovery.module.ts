import { injectable, interfaces, inject } from 'inversify';

import { MicroModule, MicroOrchestratorTypes, ModuleProvider } from '@uprtcl/micro-orchestrator';
import {
  DiscoveryService,
  CacheService,
  MultiSourceService,
  CacheDexie,
  KnownSourcesDexie,
  CortexTypes,
  DiscoveryTypes,
  Source,
  KnownSourcesService
} from '@uprtcl/cortex';

import { graphQlSchemaModule } from '../graphql/graphql-schema.module';
import { discoveryTypeDefs } from './discovery-schema';

export function discoveryModule(
  cacheService: CacheService = new CacheDexie(),
  localKnownSources: KnownSourcesService = new KnownSourcesDexie()
): any {
  @injectable()
  class DiscoveryModule implements MicroModule {
    constructor(
      @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
    ) {}

    async onLoad(
      context: interfaces.Context,
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      await this.moduleProvider(CortexTypes.Module);
      await Promise.all([cacheService.ready(), localKnownSources.ready()]);

      bind<MultiSourceService>(DiscoveryTypes.MultiSource).to(MultiSourceService);
      bind<CacheService>(DiscoveryTypes.Cache).toConstantValue(cacheService);
      bind<KnownSourcesService>(DiscoveryTypes.LocalKnownSources).toConstantValue(
        localKnownSources
      );
      bind<Source>(DiscoveryTypes.DiscoveryService).to(DiscoveryService);
    }

    submodules = [graphQlSchemaModule(discoveryTypeDefs, {})];
  }
  return DiscoveryModule;
}
