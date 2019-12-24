// Required by inversify
import 'reflect-metadata';

/** Types */
export { Commit, Perspective, Context, EveesTypes, PerspectiveDetails } from './types';

/** Services interfaces */
export { EveesSource } from './services/evees.source';
export { EveesProvider } from './services/evees.provider';
export { EveesRemote } from './services/evees.remote';
export { EveesDexie } from './services/providers/evees.dexie';

/** Service providers */
export { EveesHolochain } from './services/providers/holochain/evees.holochain';
export { EveesEthereum } from './services/providers/ethereum/evees.ethereum';
export { EveesHttp } from './services/providers/http/evees.http';

export { eveesModule } from './evees.module';

/** Merge */

export { Mergeable } from './properties/mergeable';

export { MergeStrategy } from './merge/merge-strategy';
export { SimpleMergeStrategy } from './merge/simple.merge-strategy';
export { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
export { mergeStrings, mergeResult } from './merge/utils';
