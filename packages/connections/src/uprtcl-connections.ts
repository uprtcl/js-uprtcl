// Connections
export { Connection, ConnectionOptions } from './connections/connection';

// Holochain
export {
  HolochainConnection,
  HolochainConnectionOptions,
  EntryResult
} from './services/holochain/holochain.connection';
export { HolochainSource } from './services/holochain/holochain.source';
export { HolochainProxy } from './services/holochain/holochain.proxy';
export { KnownSourcesHolochain } from './services/holochain/known-sources.holochain';

// Ipfs
export { IpfsSource, IpfsConnectionOptions } from './services/ipfs/ipfs.source';

// Ethereum
export { EthereumConnection } from './services/ethereum/ethereum.connection';
export { provider } from 'web3-core';
