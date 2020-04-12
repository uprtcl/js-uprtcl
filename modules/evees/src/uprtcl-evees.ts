// Required by inversify
import 'reflect-metadata';

/** Types */
export {
  Commit,
  Perspective,
  Context,
  PerspectiveDetails,
  RemotesConfig,
  UprtclAction,
  NodeActions
} from './types';

/** Services interfaces */
export { EveesSource } from './services/evees.source';
export { EveesProvider, NewPerspectiveData } from './services/evees.provider';
export { EveesRemote } from './services/evees.remote';

/** Service providers */
export { EveesHolochain } from './services/providers/holochain/evees.holochain';
export { EveesEthereum } from './services/providers/ethereum/evees.ethereum';
export { EveesHttp } from './services/providers/http/evees.http';

export { Evees } from './services/evees';
export { EveesModule } from './evees.module';

/** Merge */
export { Mergeable } from './properties/mergeable';

export { MergeStrategy } from './merge/merge-strategy';
export { SimpleMergeStrategy } from './merge/simple.merge-strategy';
export { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
export { mergeStrings, mergeResult } from './merge/utils';
export { EveesBindings } from './bindings';

/** Elements */
export { CommitHistory } from './elements/evees-commit-history';
export { PerspectivesList } from './elements/evees-perspectives-list';
export { EveesInfoPopper } from './elements/evees-info-popper';
export { EveesInfoPage } from './elements/evees-info-page';
export { UpdateContentEvent, UpdateContentArgs, ContentUpdatedEvent, SpliceChildrenEvent, CONTENT_UPDATED_TAG } from './elements/events';

/** UI support components */
export { MenuConfig } from './elements/common-ui/evees-options-menu';
export { eveeColor, DEFAULT_COLOR } from './elements/support';

/** Queries */
export { CREATE_COMMIT, UPDATE_HEAD, CREATE_PERSPECTIVE, CREATE_ENTITY } from './graphql/queries';

/** Patterns */
export { PerspectiveEntity, PerspectiveLinks } from './patterns/perspective.pattern';
export { CommitEntity, CommitLens, CommitLinked } from './patterns/commit.pattern';
export { CidHashedPattern, recognizeHashed } from './patterns/cid-hashed.pattern';
export { DefaultSignedPattern } from './patterns/default-signed.pattern';
export { DefaultSecuredPattern, Secured } from './patterns/default-secured.pattern';

/** Utils */
export { isAncestorOf } from './utils/ancestor';
