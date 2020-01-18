// Required by inversify
import 'reflect-metadata';

/** Services */
export { Authority } from './services/sources/authority';
export { Ready } from './services/sources/ready';
export { Source } from './services/sources/source';

export { KnownSourcesService } from './services/known-sources/known-sources.service';
export { KnownSourcesDexie } from './services/known-sources/known-sources.dexie';

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
