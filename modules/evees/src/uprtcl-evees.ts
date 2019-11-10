// Required by inversify
import 'reflect-metadata';

/** _Prtcl */
export { Commit, Perspective, Context, UprtclTypes } from './types';
export { UprtclSource } from './services/uprtcl.source';
export { UprtclProvider } from './services/uprtcl.provider';
export { UprtclRemote } from './services/uprtcl.remote';

export { UprtclHolochain } from './services/providers/holochain/uprtcl.holochain';
export { UprtclEthereum } from './services/providers/ethereum/uprtcl.ethereum';

export { eveesModule } from './evees.module';
