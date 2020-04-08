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
  UprtclAction
} from './types';

/** Services interfaces */
export { EveesSource } from './services/evees.source';
export { EveesProvider, NewPerspectiveData } from './services/evees.provider';
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
export { EveesContent } from './elements/evees-content';
export {
  UpdateContentEvent,
  UpdateContentArgs,
  RemoveChildrenEvent,
  AddSyblingsEvent,
  ContentUpdatedEvent,
  CONTENT_UPDATED_TAG
} from './elements/events';

/** UI support components */
export { MenuConfig } from './elements/common-ui/evees-options-menu';

/** Queries */
export { CREATE_COMMIT, UPDATE_HEAD, CREATE_PERSPECTIVE } from './graphql/queries';
export { contentCreateResolver } from './graphql/resolvers';

/** Patterns */
export {
  PerspectiveAccessControl,
  PerspectiveCreate,
  PerspectivePattern,
  PerspectiveLinks
} from './patterns/perspective.pattern';
export { CommitCreate, CommitLinked, CommitPattern } from './patterns/commit.pattern';
export { Secured, signAndHashObject, hashObject } from './patterns/cid-hash';
export { extractSignedEntity, signObject } from './patterns/signed';

/** Utils */
export { isAncestorOf } from './utils/ancestor';
