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

/** Utils */
export {
  linksFromObject,
  getUplToDiscover,
  discoverKnownSources,
  discoverLinksKnownSources
} from './services/discovery.utils';

/** Modules */
export { DiscoveryModule } from './discovery.module';
export { SourcesModule } from './sources.module';
