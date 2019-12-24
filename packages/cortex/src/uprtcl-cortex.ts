// Required by inversify
import 'reflect-metadata';

/** Services */
export { Ready, ServiceProvider } from './services/sources/service.provider';
export { Source, SourceProvider } from './services/sources/source';

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

/** Patterns */
export { Pattern, Entity, Property } from './patterns/pattern';
export { Cloneable } from './patterns/properties/cloneable';
export { Creatable } from './patterns/properties/creatable';
export { HasContent } from './patterns/properties/has-content';
export { Derivable } from './patterns/properties/derivable';
export { Hashable, Hashed } from './patterns/properties/hashable';
export { HasLinks, HasChildren } from './patterns/properties/has-links';
export { HasRedirect } from './patterns/properties/has-redirect';
export { IsSecure } from './patterns/properties/is-secure';
export { Signable, Signed } from './patterns/properties/signable';
export { IsValid } from './patterns/properties/is-valid';
export { HasType } from './patterns/properties/has-type';
export { HasTitle } from './patterns/properties/has-title';
export { HasText } from './patterns/properties/has-text';
export { Transformable } from './patterns/properties/transformable';
export { CreateChild } from './patterns/properties/create-child';
export { HasActions, PatternAction } from './patterns/properties/has-actions';

// Pattern Registry
export { PatternRecognizer } from './patterns/recognizer/pattern.recognizer';

/** Types */
export { LensesTypes, DiscoveryTypes, CortexTypes } from './types';

/** Module */
export { PatternsModule, patternsModule } from './modules/patterns.module';
export { SourcesModule, sourcesModule } from './modules/sources.module';

/** Utils */
export {
  linksFromObject,
  getUplToDiscover,
  discoverKnownSources,
  discoverLinksKnownSources
} from './services/discovery.utils';
