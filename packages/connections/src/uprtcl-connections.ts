import 'reflect-metadata';

// Connections
export { Connection, ConnectionOptions } from './connections/connection';

// Holochain
export { HolochainSource } from './services/holochain/holochain.source';
export {
  HolochainConnection,
  HolochainConnectionOptions
} from './services/holochain/holochain.connection';
export {
  EntryResult,
  HolochainProviderOptions,
  HolochainProvider
} from './services/holochain/holochain.provider';
export { HolochainProxy } from './services/holochain/holochain.proxy';
export { KnownSourcesHolochain } from './services/holochain/known-sources.holochain';

// Ipfs
export { IpfsSource } from './services/ipfs/ipfs.source';
export { IpfsConnection, IpfsConnectionOptions } from './services/ipfs/ipfs.connection';
export { CidConfig, defaultCidConfig } from './services/ipfs/cid.config';

// Ethereum
export {
  EthereumConnection,
  EthereumConnectionOptions
} from './services/ethereum/ethereum.connection';
export { EthereumProvider, EthereumProviderOptions } from './services/ethereum/ethereum.provider';

// Http
export { HttpConnection } from './services/http/http.connection';
export { HttpProvider } from './services/http/http.provider';
export { KnownSourcesHttp } from './services/http/known-sources.http';
