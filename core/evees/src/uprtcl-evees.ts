/** Types */
export {
  Commit,
  Perspective,
  PerspectiveDetails,
  Update,
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
  SearchOptionsEcoJoin,
  SearchOptionsJoin,
  ParentAndChild,
  SearchResult,
  UpdateDetails,
  ForkOf,
  UpdatePerspectiveData,
} from './evees/interfaces/types';

/** interfaces */
export { EveesContentModule } from './evees/interfaces/evees.content.module';

export { Evees, EveesEvents } from './evees/evees.service';
export { ClientRemote } from './evees/interfaces/client.remote';
export { Client, ClientEvents } from './evees/interfaces/client';
export { CASStore } from './evees/interfaces/cas-store';

export { Entity, EntityCreate } from './evees/interfaces/entity';
export { Signed } from './patterns/interfaces/signable';
export { CidConfig } from './evees/interfaces/cid-config';
export { Secured } from './evees/utils/cid-hash';

export { hashObject } from './evees/utils/cid-hash';

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

export {
  mergeStrings,
  mergeResult,
  mergeArrays,
  arrayDiff,
  combineMutations,
} from './evees/merge/utils';

/** Utils */
export { isAncestorOf } from './evees/merge/ancestor';
export { Connection, ConnectionOptions } from './utils/connection';
export { Ready } from './utils/ready';
export { ConnectionLogged, ConnectionLoggedEvents } from './evees/interfaces/connection.logged';
export { filterAsync, mapAsync, AsyncQueue } from './utils/async';

/** Proposals */
export { Proposal } from './evees/proposals/types';
export { Proposals, ProposalEvents } from './evees/proposals/proposals';
export { ProposalsWithEvees } from './evees/proposals/proposals.with.evees';

/** Aceess Control */
export { AccessControl } from './evees/interfaces/access-control';

export { Logger } from './utils/logger';

/* merge */
export { MergeConfig, MergeStrategy } from './evees/merge/merge-strategy';

/** Patterns */
export { Behaviour } from './patterns/interfaces/behaviour';
export { HasChildren, HasLinks, LinkingBehaviorNames } from './patterns/behaviours/has-links';
export { HasTitle } from './patterns/behaviours/has-title';
export { HasEmpty } from './patterns/behaviours/has-empty';
export { PatternRecognizer } from './patterns/recognizer/pattern-recognizer';
export { Pattern } from './patterns/interfaces/pattern';
export { PerspectiveType } from './evees/patterns/perspective.pattern';
export { CommitType } from './evees/patterns/commit.pattern';

/** container */
export { init } from './creator-helpers/init';

export { AppElement, AppElements } from './creator-helpers/app.elements';

/** Clients */
export { ClientMutationMemory } from './evees/clients/memory/mutation.memory';
export { ClientMutationLocal } from './evees/clients/local/client.mutation.local';
export { MutationStoreLocal } from './evees/clients/local/mutation.store.local';
export {
  ClientMutationBase,
  ClientCachedEvents,
} from './evees/clients/cached/client.mutation.base';

/** Evees Utils */
export { CondensateCommits } from './evees/utils/condensate.commits';
export { condensateUpdates } from './evees/utils/condensate.updates';
