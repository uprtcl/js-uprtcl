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
export { ConnectionLogged } from './utils/connection.logged';
export { filterAsync, mapAsync, AsyncQueue } from './utils/async';

/** Proposals */
export { Proposal } from './evees/proposals/types';
export { Proposals, ProposalEvents } from './evees/proposals/proposals';
export { ProposalsWithEvees } from './evees/proposals/proposals.with.evees';

/** Aceess Control */
export { AccessControl } from './evees/interfaces/access-control';
export { RemoteLogged, RemoteLoggedEvents } from './evees/interfaces/remote.logged';

export { Logger } from './utils/logger';

/** CAS */
export {
  Secured,
  hashObject,
  deriveEntity,
  sortObject,
  cidConfigOf,
  validateEntities,
  cidToHex32,
  bytes32ToCid,
} from './cas/utils/cid-hash';
export { deriveSecured, signObject } from './cas/utils/signed';
export { Signed } from './patterns/interfaces/signable';
export { Entity, EntityCreate } from './cas/interfaces/entity';
export { CASStore, EntityGetResult } from './cas/interfaces/cas-store';
export { CASRemote } from './cas/interfaces/cas-remote';
export { CidConfig, defaultCidConfig } from './cas/interfaces/cid-config';

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
export { ClientOnMemory } from './evees/clients/memory/client.memory';
export { RemoteEveesLocal } from './evees/clients/local/remote.local';
export { ClientCachedLocal } from './evees/clients/local/client.cached.local';
export { CacheLocal } from './evees/clients/local/cache.local';
export { ClientCachedBase, ClientCachedEvents } from './evees/clients/cached/client.cached.base';

export { CASOnMemory } from './cas/stores/cas.memory';
export { CASLocal } from './cas/stores/cas.local';
export { CASRemoteLocal } from './cas/stores/cas.remote.local';

/** Evees Utils */
export { CondensateCommits } from './evees/utils/condensate.commits';
export { condensateUpdates } from './evees/utils/condensate.updates';
