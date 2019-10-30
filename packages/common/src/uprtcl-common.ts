// Required by inversify
import 'reflect-metadata';

/** _Prtcl */
export { Commit, Perspective, Context, UprtclTypes } from './types';
export { UprtclSource } from './uprtcl/services/uprtcl.source';
export { UprtclProvider } from './uprtcl/services/uprtcl.provider';
export { UprtclRemote } from './uprtcl/services/uprtcl.remote';

export { UprtclHolochain } from './uprtcl/services/providers/holochain/uprtcl.holochain';
export { UprtclEthereum } from './uprtcl/services/providers/ethereum/uprtcl.ethereum';

export { uprtclModule } from './uprtcl/uprtcl.module';

/** Access Control */
export { updatePlugin } from './access-control/plugins/update.plugin';

/** Drafts */
export { draftsModule } from './draft/draft.module';
export { DraftsService } from './draft/services/drafts.service';
export { DraftsHolochain } from './draft/services/drafts.holochain';
export { DraftsLocal } from './draft/services/drafts.local';
