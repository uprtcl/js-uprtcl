/** Services */
export { Source } from './services/sources/source';
export { DiscoverableSource } from './services/sources/discoverable.source';
// export { HolochainSource } from './services/sources/holochain.source';
// export { IpfsSource } from './services/sources/ipfs.source';

export { KnownSourcesService } from './services/known-sources/known-sources.service';
export { KnownSourcesDexie } from './services/known-sources/known-sources.dexie';

export { MultiSourceService } from './services/multi/multi-source.service';
export { MultiProviderService } from './services/multi/multi-provider.service';

export { CacheDexie } from './services/cache/cache.dexie';
export { CacheService } from './services/cache/cache.service';

export { CachedSourceService } from './services/cached-remotes/cached-source.service';
export { CachedProviderService } from './services/cached-remotes/cached-provider.service';
export {
  CachedMultiProviderService
} from './services/cached-remotes/cached-multi-provider.service';

export { DiscoveryService } from './services/discovery.service';
export { DiscoveryModule } from './services/discovery.module';

/** Patterns */
export { Pattern } from './patterns/pattern';
export { ContentPattern } from './patterns/patterns/content.pattern';
export { DerivePattern } from './patterns/patterns/derive.pattern';
export { HashedPattern, Hashed } from './patterns/patterns/hashed.pattern';
export { LinkedPattern } from './patterns/patterns/linked.pattern';
export { RenderPattern } from './patterns/patterns/render.pattern';
export { SecuredPattern } from './patterns/patterns/secured.pattern';
export { SignedPattern, Signed } from './patterns/patterns/signed.pattern';
export { ValidatePattern } from './patterns/patterns/validate.pattern';
export { TypePattern } from './patterns/patterns/type.pattern';
export { TextPattern } from './patterns/patterns/text.pattern';

// Default patterns
// export { DefaultHashedPattern } from './patterns/defaults/default-hashed.pattern';
export { DefaultSignedPattern } from './patterns/defaults/default-signed.pattern';
export { DefaultSecuredPattern, Secured } from './patterns/defaults/default-secured.pattern';
export { DefaultRenderPattern } from './patterns/defaults/default-render.pattern';
export { DefaultNodePattern, Node } from './patterns/defaults/default-node.pattern';

// Pattern Registry
export { PatternRegistry } from './patterns/registry/pattern.registry';
export {
  PatternRegistryModule,
  PATTERN_REGISTRY_MODULE_ID
} from './patterns/pattern-registry.module';

/** Entities */
export {
  loadEntity,
  entitiesReducer,
  EntityActions,
  EntitiesState,
  selectById,
  selectAll,
  selectByPattern,
  selectEntities,
  entitiesReducerName,
  entitiesReduxModule
} from './entities';

/** Lenses */
export { LensesModule, LENSES_MODULE_ID } from './lenses/lenses.module';
export { Lens, MenuItem, LensElement } from './types';

/** Utils */
export { Logger } from './utils/logger';
