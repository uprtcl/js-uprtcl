// Required by inversify
import 'reflect-metadata';

/** Services */
export { Authority } from './types/authority';
export { Ready } from './types/ready';
export { CASSource } from './types/cas-source';
export { CASStore } from './types/cas-store';
export { CidConfig, defaultCidConfig } from './types/cid-config';

export { KnownSourcesService } from './references/known-sources/known-sources.service';
export { KnownSourcesSource } from './references/known-sources/known-sources.source';

export { MultiSourceService } from './references/known-sources/multi-source.service';
export { EntityCache } from './graphql/entity-cache';

/** Modules */
export { DiscoveryModule } from './discovery.module';
export { CASModule } from './cas.module';

/** Connections */
export { Connection, ConnectionOptions } from './connections/connection';
export { SocketConnection } from './connections/socket.connection';

/** Utils */
export { createEntity } from './utils/entities';

export {
  linksFromEntity,
  getUplToDiscover,
  discoverKnownSources,
  discoverLinksKnownSources
} from './references/known-sources/discovery.utils';
