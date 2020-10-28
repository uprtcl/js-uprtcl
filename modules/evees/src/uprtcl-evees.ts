// Required by inversify
import 'reflect-metadata';

/** Types */
export { Commit, Perspective, Context, PerspectiveDetails, HasDiffLenses, DiffLens } from './types';

/** Services interfaces */
export { EveesSource } from './services/evees.source';
export { EveesProvider } from './services/evees.provider';
export { EveesRemote } from './services/evees.remote';
export { NewPerspectiveData } from './types';
export { EveesConfig } from './types';

/** Service providers */
export { Evees } from './services/evees';
export { EveesModule } from './evees.module';
export { EveesContentModule } from './evees-content.module';
export { EveesWorkspace } from './services/evees.workspace';
export { EveesDraftsLocal } from './services/providers/local/evees.drafts.local';

/** Merge */
export { Merge } from './behaviours/merge';

export { MergeStrategy } from './merge/merge-strategy';
export { SimpleMergeStrategy } from './merge/simple.merge-strategy';
export { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
export { mergeStrings, mergeResult } from './merge/utils';
export { EveesBindings } from './bindings';

/** Elements */
export { CommitHistory } from './elements/evees-commit-history';
export { EveesPerspectivesList } from './elements/evees-perspectives-list';
export { EveesInfoPopper } from './elements/evees-info-popper';
export { EveesInfoPage } from './elements/evees-info-page';
export { EveesInfoBase } from './elements/evees-info-base';
export { EveesInfoUserBased } from './elements/evees-info-user-based';
export { ProposalsList } from './elements/evees-proposals-list';
export { EveesPerspectiveIcon } from './elements/evees-perspective-icon';

export {
  UpdateContentEvent,
  UpdateContentArgs,
  ContentUpdatedEvent,
  SpliceChildrenEvent,
  CONTENT_UPDATED_TAG
} from './elements/events';
export { EveesDiff } from './elements/evees-diff';

/** UI support components */
export { prettyAddress } from './elements/support';
export { eveeColor, DEFAULT_COLOR } from './elements/support';

/** Queries */
export { UPDATE_HEAD, CREATE_PERSPECTIVE, CREATE_ENTITY, CREATE_PROPOSAL } from './graphql/queries';
export { EveesHelpers, CreatePerspective, CreateCommit } from './graphql/evees.helpers';

/** Patterns */
export { PerspectivePattern, PerspectiveLinks } from './patterns/perspective.pattern';
export { CommitLinked, CommitPattern } from './patterns/commit.pattern';
export { Secured, hashObject, deriveEntity } from './utils/cid-hash';
export { extractSignedEntity, deriveSecured, signObject } from './utils/signed';

/** Utils */
export { isAncestorOf } from './utils/ancestor';

/** Proposals */
export {
  Proposal,
  UpdateRequest,
  NewProposal,
  ProposalDetails,
  PROPOSAL_CREATED_TAG
} from './types';
export { ProposalsProvider } from './services/proposals.provider';

/** Aceess Control */
export { AccessControlService } from './services/evees.access-control';
export { Remote } from './remote';
