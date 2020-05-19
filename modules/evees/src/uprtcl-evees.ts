// Required by inversify
import 'reflect-metadata';

/** Types */
export {
  Commit,
  Perspective,
  Context,
  PerspectiveDetails,
  RemoteMap,
  HasDiffLenses,
  DiffLens,
} from './types';

/** Services interfaces */
export { EveesSource } from './services/evees.source';
export { EveesProvider } from './services/evees.provider';
export { EveesRemote } from './services/evees.remote';
export { EveesDraftsLocal } from './services/providers/local/evees.drafts.local';
export { NewPerspectiveData } from './types';

/** Service providers */
export { EveesHolochain } from './services/providers/holochain/evees.holochain';
export { EveesEthereum } from './services/providers/ethereum/evees.ethereum';
export { EveesHttp } from './services/providers/http/evees.http';

export { Evees } from './services/evees';
export { EveesModule } from './evees.module';
export { EveesContentModule } from './evees-content.module';
export { EveesWorkspace } from './services/evees.workspace';

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
export {
  UpdateContentEvent,
  UpdateContentArgs,
  ContentUpdatedEvent,
  SpliceChildrenEvent,
  CONTENT_UPDATED_TAG,
} from './elements/events';

/** UI support components */
export { MenuConfig } from './elements/common-ui/evees-options-menu';
export { prettyAddress } from './elements/support';
export { eveeColor, DEFAULT_COLOR } from './elements/support';

/** Queries */
export { UPDATE_HEAD, CREATE_PERSPECTIVE, CREATE_ENTITY } from './graphql/queries';
export { EveesHelpers, CreatePerspective, CreateCommit } from './graphql/helpers';

/** Patterns */
export {
  PerspectiveAccessControl,
  PerspectivePattern,
  PerspectiveLinks,
} from './patterns/perspective.pattern';
export { CommitLinked, CommitPattern } from './patterns/commit.pattern';
export { Secured, hashObject, deriveEntity } from './utils/cid-hash';
export { extractSignedEntity, deriveSecured, signObject } from './utils/signed';

/** Utils */
export { isAncestorOf } from './utils/ancestor';
