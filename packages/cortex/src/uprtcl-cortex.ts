// Required by inversify
import 'reflect-metadata';

/** Services */
export { Source, Ready } from './services/sources/source';
export { NamedSource, NamedRemote } from './services/sources/named.source';
export { DiscoverableSource } from './services/sources/discoverable.source';

export { KnownSourcesService } from './services/known-sources/known-sources.service';
export { KnownSourcesDexie } from './services/known-sources/known-sources.dexie';

export { MultiSourceService } from './services/multi/multi-source.service';
export { MultiService } from './services/multi/multi.service';

export { CacheDexie } from './services/cache/cache.dexie';
export { CacheService } from './services/cache/cache.service';

export { CachedSourceService } from './services/cached-remotes/cached-source.service';
export { CachedService } from './services/cached-remotes/cached.service';
export { CachedMultiService } from './services/cached-remotes/cached-multi.service';
export { CachedMultiSourceService } from './services/cached-remotes/cached-multi-source.service';

export { DiscoveryService } from './services/discovery.service';
export { discoveryModule } from './services/discovery.module';

/** Patterns */
export { Pattern } from './patterns/pattern';
export { Cloneable } from './patterns/properties/cloneable';
export { Creatable } from './patterns/properties/creatable';
export { HasContent } from './patterns/properties/has-content';
export { Derivable } from './patterns/properties/derivable';
export { Hashable, Hashed } from './patterns/properties/hashable';
export { HasLinks } from './patterns/properties/has-links';
export { HasRedirect } from './patterns/properties/has-redirect';
export { IsSecure } from './patterns/properties/is-secure';
export { Signable, Signed } from './patterns/properties/signable';
export { IsValid } from './patterns/properties/is-valid';
export { HasType } from './patterns/properties/has-type';
export { HasText } from './patterns/properties/has-text';
export { Transformable } from './patterns/properties/transformable';
export { HasLenses } from './patterns/properties/has-lenses';
export { HasActions } from './patterns/properties/has-actions';
export { Updatable } from './patterns/properties/updatable';

// Default patterns
export {
  CidHashedPattern,
  recognizeHashed,
  CidConfig,
  defaultCidConfig
} from './patterns/defaults/cid-hashed.pattern';
export { DefaultSignedPattern } from './patterns/defaults/default-signed.pattern';
export { DefaultSecuredPattern, Secured } from './patterns/defaults/default-secured.pattern';

// Pattern Registry
export { PatternRecognizer } from './patterns/recognizer/pattern.recognizer';
export { PatternsModule } from './patterns/patterns.module';

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
export { lensesModule } from './elements/lenses.module';
export { Lens, PatternAction, LensElement } from './types';
export { Plugin } from './elements/base/plugin';
export { lensSelectorPlugin } from './elements/plugins/lens-selector.plugin';
export { actionsPlugin } from './elements/plugins/actions.plugin';
export { Node, NodeList } from './elements/lenses/node-list';

/** Types */
export { DiscoveryTypes, PatternTypes, EntitiesTypes, LensesTypes } from './types';

/** Module */
export { CortexModule } from './cortex.module';
export { CortexEntityBase } from './elements/base/cortex-entity-base';

/** Utils */
export { sortObject } from './utils/utils';
