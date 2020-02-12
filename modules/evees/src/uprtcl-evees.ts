// Required by inversify
import 'reflect-metadata';

/** Types */
export { Commit, Perspective, Context, PerspectiveDetails } from './types';

/** Services interfaces */
export { EveesSource } from './services/evees.source';
export { EveesProvider } from './services/evees.provider';
export { EveesRemote } from './services/evees.remote';

/** Service providers */
export { EveesHolochain } from './services/providers/holochain/evees.holochain';
export { EveesEthereum } from './services/providers/ethereum/evees.ethereum';
export { EveesHttp } from './services/providers/http/evees.http';

export {
  Evees,
  NewPerspectiveArgs,
  CreatePerspectiveArgs,
  CreateCommitArgs
} from './services/evees';

export { EveesModule } from './evees.module';

/** Merge */
export { Mergeable } from './properties/mergeable';

export { MergeStrategy } from './merge/merge-strategy';
export { SimpleMergeStrategy } from './merge/simple.merge-strategy';
export { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
export { OwnerPreservingMergeStrategy } from './merge/owner-preserving.merge-strategy';
export { mergeStrings, mergeResult } from './merge/utils';
export { EveesBindings } from './bindings';

/** Elements */
export { CommitHistory } from './elements/evees-commit-history';
export { PerspectivesList } from './elements/evees-perspectives-list';
export { EveesInfoPopper } from './elements/evees-info-popper';
export { EveesInfoPage } from './elements/evees-info-page';
export { EveesPerspective } from './elements/evees-perspective';
export { UpdateContentEvent, UpdateContentArgs } from './elements/events';

/** Queries */
export { CREATE_COMMIT, UPDATE_HEAD, CREATE_PERSPECTIVE } from './graphql/queries';

/** Patterns */
export { PerspectiveEntity, PerspectiveLinks } from './patterns/perspective.pattern';
export { CommitEntity, CommitLens, CommitLinked, CommitPattern } from './patterns/commit.pattern';
export { CidHashedPattern, recognizeHashed } from './patterns/cid-hashed.pattern';
export { DefaultSignedPattern } from './patterns/default-signed.pattern';
export { DefaultSecuredPattern, Secured } from './patterns/default-secured.pattern';

/** Utils */
export { isAncestorOf } from './utils/ancestor';