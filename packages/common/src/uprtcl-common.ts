// Required by inversify
import 'reflect-metadata';

/** _Prtcl */
export { Commit, Perspective, Context, UprtclTypes } from './types';
export { UprtclProvider } from './services/providers/uprtcl.provider';
export { UprtclHolochain } from './services/providers/uprtcl.holochain';

export { uprtclModule } from './uprtcl.module';
