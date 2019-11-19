// Required by inversify
import 'reflect-metadata';

/** Services */
export { Ready, ServiceProvider } from './services/sources/service.provider';
export { Source, SourceProvider } from './services/sources/source';
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
export { IsEntity } from './patterns/properties/is-entity';
export { HasText } from './patterns/properties/has-text';
export { Transformable } from './patterns/properties/transformable';
export { CreateChild } from './patterns/properties/create-child';
export { HasActions, PatternAction } from './patterns/properties/has-actions';

// Pattern Registry
export { PatternRecognizer } from './patterns/recognizer/pattern.recognizer';
export { PatternsModule } from './patterns/patterns.module';

/** Types */
export { LensesTypes, DiscoveryTypes, PatternTypes, UplAuth } from './types';

/** Module */
export { CortexModule } from './cortex.module';
