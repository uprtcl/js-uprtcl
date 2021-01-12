// Required by inversify
import 'reflect-metadata';

/** Types */
export { Commit, Perspective, PerspectiveDetails, HasDiffLenses, DiffLens } from './types';

/** Services interfaces */
export { Source } from './services/source';
export { NewPerspectiveData } from './types';
export { EveesConfig } from './types';
export { EveesContentModule } from './evees/interfaces/evees.content.module';

/** Service providers */
export { Evees } from './evees/evees.service';
export { Client } from './evees/interfaces/client';

/** Merge */
export { Merge } from './evees/behaviours/merge';

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
export { Secured, hashObject, deriveEntity } from './utils/cid-hash';
export { extractSignedEntity, deriveSecured, signObject } from './utils/signed';

/** Utils */
export { isAncestorOf } from './utils/ancestor';

/** Proposals */
export { Proposal, UpdateRequest, PROPOSAL_CREATED_TAG } from './types';
export { Proposals } from './services/proposals';

/** Aceess Control */
export { AccessControl } from './evees/interfaces/access-control';
export { RemoteLogged } from './evees/interfaces/remote.logged';
export { RemoteEvees } from './services/remote.evees';
export { RemoteWithUI } from './evees/interfaces/remote.with-ui';
