/** Types */
export {
  Commit,
  Perspective,
  PerspectiveDetails,
  HasDiffLenses,
  DiffLens,
} from './evees/interfaces/types';

/** interfaces */
export { NewPerspectiveData } from './evees/interfaces/types';
export { EveesConfig } from './evees/interfaces/types';
export { EveesContentModule } from './evees/interfaces/evees.content.module';

export { Evees } from './evees/evees.service';
export { Client } from './evees/interfaces/client';
export { RemoteEvees } from './evees/interfaces/remote.evees';

/** Merge */
export { Merge } from './evees/merge/merge.behaviour';

export { SimpleMergeStrategy } from './evees/merge/simple.merge-strategy';
export { RecursiveContextMergeStrategy } from './evees/merge/recursive-context.merge-strategy';
export { mergeStrings, mergeResult } from './evees/merge/utils';

/** Elements */
export { EveesPerspectivesList } from './evees/elements/evees-perspectives-list';
export { EveesBaseElement } from './evees/elements/evees-base';
export { EveesInfoPopper } from './evees/elements/evees-info-popper';
export { EveesInfoPage } from './evees/elements/evees-info-page';
export { EveesInfoBase } from './evees/elements/evees-info-base';
export { EveesInfoUserBased, EveesInfoConfig } from './evees/elements/evees-info-user-based';
export { ProposalsList } from './evees/elements/evees-proposals-list';
export { EveesPerspectiveIcon } from './evees/elements/evees-perspective-icon';

export {
  UpdateContentEvent,
  UpdateContentArgs,
  ContentUpdatedEvent,
  SpliceChildrenEvent,
  CONTENT_UPDATED_TAG,
} from './evees/elements/events';
export { EveesDiff } from './evees/elements/evees-diff';

/** UI support components */
export { prettyAddress } from './evees/elements/support';
export { eveeColor, DEFAULT_COLOR } from './evees/elements/support';

/** Patterns */
export { Secured, hashObject, deriveEntity } from './cas/utils/cid-hash';
export { extractSignedEntity, deriveSecured, signObject } from './cas/utils/signed';
export { PerspectiveType } from './evees/patterns/perspective.pattern';
export { CommitType } from './evees/patterns/commit.pattern';

/** Utils */
export { isAncestorOf } from './evees/merge/ancestor';

/** Proposals */
export { Proposal, UpdateRequest, PROPOSAL_CREATED_TAG } from './evees/interfaces/types';

/** Aceess Control */
export { AccessControl } from './evees/interfaces/access-control';
export { RemoteLogged } from './evees/interfaces/remote.logged';
export { RemoteWithUI } from './evees/interfaces/remote.with-ui';

export { Logger } from './utils/logger';

/** CAS */
export { Entity } from './cas/interfaces/entity';

/** Patterns */
export { HasChildren } from './patterns/behaviours/has-links';
export { PatternRecognizer } from './patterns/recognizer/pattern-recognizer';

/** container */
export { eveesConnect } from './container/evees-connect.mixin';
