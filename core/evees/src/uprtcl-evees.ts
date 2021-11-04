export * from './evees/interfaces';
export * from './evees/clients';
export * from './evees/utils';
export * from './patterns';
export * from './utils';
export * from './creator-helpers';

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

/** Proposals */
export { Proposal } from './evees/proposals/types';
export { Proposals, ProposalEvents } from './evees/proposals/proposals';
export { ProposalsWithEvees } from './evees/proposals/proposals.with.evees';

/* merge */
export { MergeConfig, MergeStrategy } from './evees/merge/merge-strategy';

/** Evees Utils */
export { CondensateCommits } from './evees/utils/condensate.commits';
export { condensateUpdates } from './evees/utils/updates.utils';
