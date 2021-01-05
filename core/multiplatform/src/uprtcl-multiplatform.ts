// Required by inversify
import 'reflect-metadata';

/** Services */
export { Ready } from './types/ready';
export { CASSource } from './types/cas-source';
export { CASStore } from './types/cas-store';
export { CidConfig, defaultCidConfig } from './types/cid-config';

export { MultiSourceService } from './services/multi-source.service';

/** Modules */
export { DiscoveryModule } from './discovery.module';
export { CASModule } from './cas.module';

/** Connections */
export { Connection, ConnectionOptions } from './connections/connection';
export { SocketConnection } from './connections/socket.connection';
