// Required by inversify
import 'reflect-metadata';

/** _Prtcl */
export { Commit, Perspective, Context, UprtclTypes } from './types';
export { UprtclProvider } from './services/uprtcl/uprtcl.provider';
export { UprtclHolochain } from './services/uprtcl/uprtcl.holochain';

export { uprtclModule } from './uprtcl.module';

/** Services */
export { ProxyProvider } from './services/proxy/proxy.provider';
