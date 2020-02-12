// Required by inversify
import 'reflect-metadata';

/** Services */
export { Authority } from './types/authority';
export { Ready } from './types/ready';
export { Source } from './types/source';

export { KnownSourcesService } from './services/known-sources.service';

export { DiscoveryService } from './services/discovery.service';
export { EntityCache } from './graphql/entity-cache';

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

/** Connections */
export { Connection, ConnectionOptions } from './connections/connection';
export { SocketConnection } from './connections/socket.connection';

/** Utils */
export { createEntity, entityContent, getIsomorphisms, computeIdOfEntity } from './utils/entities';
export { TaskQueue, Task } from './utils/task.queue';
