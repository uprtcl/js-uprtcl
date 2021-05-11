export * from './evees/interfaces/index';
export * from './patterns/index';

export { PerspectiveType } from './evees/patterns/perspective.pattern';
export { CommitType } from './evees/patterns/commit.pattern';

export { Evees, EveesEvents } from './evees/evees.service';

export { hashObject, validateEntities } from './evees/utils/cid-hash';

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
export { filterAsync, mapAsync, AsyncQueue } from './utils/async';

/** Proposals */
export { Proposal } from './evees/proposals/types';
export { Proposals, ProposalEvents } from './evees/proposals/proposals';
export { ProposalsWithEvees } from './evees/proposals/proposals.with.evees';

/** Aceess Control */

export { Logger } from './utils/logger';

/* merge */
export { MergeConfig, MergeStrategy } from './evees/merge/merge-strategy';

/** container */
export { init } from './creator-helpers/init';

export { AppElement, AppElements } from './creator-helpers/app.elements';

/** Clients */
export { ClientMutationMemory } from './evees/clients/memory/mutation.memory';
export { MutationStoreLocal } from './evees/clients/local/mutation.store.local';

/** Evees Utils */
export { CondensateCommits } from './evees/utils/condensate.commits';
export { condensateUpdates } from './evees/utils/updates.utils';
