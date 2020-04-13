// Required by inversify
import 'reflect-metadata';

/** Types */
export {
  Commit,
  Perspective,
  Context,
  PerspectiveDetails,
  RemotesConfig,
  RemoteMap,
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
export { EveesContentModule } from './evees-content.module';

/** Merge */
export { Merge } from './behaviours/merge';

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
export {
  PerspectiveAccessControl,
  PerspectivePattern,
  PerspectiveLinks
} from './patterns/perspective.pattern';
export { CommitLinked, CommitPattern } from './patterns/commit.pattern';
export { Secured, signAndHashObject, hashObject } from './utils/cid-hash';
export { extractSignedEntity, signObject } from './utils/signed';

/** Utils */
export { isAncestorOf } from './utils/ancestor';
