/** Types */
export {
  Commit,
  Perspective,
  PerspectiveDetails,
  Update,
  HasDiffLenses,
  DiffLens,
  PartialPerspective,
  CreateEvee,
  LinkChanges,
  EveesMutationCreate,
  EveesMutation,
  GetPerspectiveOptions,
  PerspectiveGetResult,
  NewPerspective,
  EveesConfig,
  Slice,
  SearchOptions,
  ParentAndChild,
  SearchResult,
  UpdateDetails,
} from './evees/interfaces/types';

/** interfaces */
export { EveesContentModule } from './evees/interfaces/evees.content.module';

export { Evees } from './evees/evees.service';
export { RemoteEvees } from './evees/interfaces/remote.evees';
export { SearchEngine } from './evees/interfaces/search.engine';
export { Client, ClientEvents } from './evees/interfaces/client';

/** Default Perspectives */
export {
  getHome,
  snapDefaultPerspective,
  getConceptPerspective,
} from './evees/default.perspectives';

/** Merge */
export { SimpleMergeStrategy } from './evees/merge/simple.merge-strategy';
export { RecursiveContextMergeStrategy } from './evees/merge/recursive-context.merge-strategy';
export { HasMerge, MergingBehaviorNames } from './evees/merge/merge.behaviour';

export { mergeStrings, mergeResult, mergeArrays } from './evees/merge/utils';

/** Elements */
export { EveesPerspectivesList } from './evees/elements/evees-perspectives-list';
export { EveesBaseElement } from './evees/elements/evees-base';
export { EveesBaseEditable } from './evees/elements/evees-base-editable';
export { EveesInfoPopper, EveesInfoConfig } from './evees/elements/evees-info-popper';
export { EveesInfoBase } from './evees/elements/evees-info-base';
export { ProposalsList } from './evees/elements/evees-proposals-list';
export { EveesPerspectiveIcon } from './evees/elements/evees-perspective-icon';

export {
  UpdateContentEvent,
  UpdateContentArgs,
  ContentUpdatedEvent,
  SpliceChildrenEvent,
  ProposalCreatedEvent,
  CONTENT_UPDATED_TAG,
  PROPOSAL_CREATED_TAG,
} from './evees/elements/events';
export { EveesDiff } from './evees/elements/evees-diff';

/** UI support components */
export { prettyAddress } from './evees/elements/support';
export { eveeColor, DEFAULT_COLOR } from './evees/elements/support';

/** Utils */
export { isAncestorOf } from './evees/merge/ancestor';
export { Connection, ConnectionOptions } from './utils/connection';
export { Ready } from './utils/ready';
export { ConnectionLogged } from './utils/connection.logged';

/** Proposals */
export { Proposal } from './evees/proposals/types';
export { Proposals, ProposalEvents } from './evees/proposals/proposals';
export { ProposalsWithUI } from './evees/proposals/proposals.with-ui';
export { ProposalsWithEvees } from './evees/proposals/proposals.with.evees';

/** Aceess Control */
export { AccessControl } from './evees/interfaces/access-control';
export { RemoteLogged, RemoteLoggedEvents } from './evees/interfaces/remote.logged';
export { RemoteWithUI } from './evees/interfaces/remote.with-ui';

export { Logger } from './utils/logger';

/** CAS */
export { Secured, hashObject, deriveEntity, sortObject } from './cas/utils/cid-hash';
export { deriveSecured, signObject } from './cas/utils/signed';
export { Signed } from './patterns/interfaces/signable';
export { Entity, ObjectOn } from './cas/interfaces/entity';
export { CASStore, EntityGetResult } from './cas/interfaces/cas-store';
export { CASRemote } from './cas/interfaces/cas-remote';
export { CidConfig } from './cas/interfaces/cid-config';

/* merge */
export { MergeConfig, MergeStrategy } from './evees/merge/merge-strategy';

/** Patterns */
export { HasChildren, HasLinks, LinkingBehaviorNames } from './patterns/behaviours/has-links';
export { HasLenses, Lens } from './patterns/behaviours/has-lenses';
export { HasTitle } from './patterns/behaviours/has-title';
export { HasEmpty } from './patterns/behaviours/has-empty';
export { PatternRecognizer } from './patterns/recognizer/pattern-recognizer';
export { Pattern } from './patterns/interfaces/pattern';
export { PerspectiveType } from './evees/patterns/perspective.pattern';
export { CommitType } from './evees/patterns/commit.pattern';

/** container */
export { servicesConnect } from './container/multi-connect.mixin';
export { eveesConstructorHelper } from './creator-helpers/evees.constructor.helper';
export { MultiContainer } from './container/multi.container';

export { AppElement, AppElements } from './creator-helpers/app.elements';

/** Clients */
export { EveesDraftsLocal } from './evees/clients/drafts.temp/evees.drafts.local';
export { ClientOnMemory } from './evees/clients/memory/client.memory';
export { RemoteEveesLocal } from './evees/clients/local/remote.local';
export { CASOnMemory } from './cas/stores/cas.memory';
export { CASLocal } from './cas/stores/cas.local';
