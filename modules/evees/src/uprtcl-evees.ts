// Required by inversify
import 'reflect-metadata';

/** Types */
export { Commit, Perspective, PerspectiveDetails, HasDiffLenses, DiffLens } from './types';

/** Services interfaces */
export { Source } from './services/source';
export { RemoteEvees } from './services/remote.evees';
export { NewPerspectiveData } from './types';
export { EveesConfig } from './types';

/** Service providers */
export { Evees } from './services/evees.service';
export { EveesModule } from './evees.module';
export { EveesContentModule } from './evees-content.module';
export { Client } from './services/client';

/** Merge */
export { Merge } from './behaviours/merge';

export { MergeStrategy } from './merge/merge-strategy';
export { SimpleMergeStrategy } from './merge/simple.merge-strategy';
export { RecursiveContextMergeStrategy } from './merge/recursive-context.merge-strategy';
export { mergeStrings, mergeResult } from './merge/utils';
export { EveesBindings } from './bindings';

/** Elements */
export { EveesPerspectivesList } from './elements/evees-perspectives-list';
export { EveesBaseElement } from './elements/evees-base';
export { EveesInfoPopper } from './elements/evees-info-popper';
export { EveesInfoPage } from './elements/evees-info-page';
export { EveesInfoBase } from './elements/evees-info-base';
export { EveesInfoUserBased, EveesInfoConfig } from './elements/evees-info-user-based';
export { ProposalsList } from './elements/evees-proposals-list';
export { EveesPerspectiveIcon } from './elements/evees-perspective-icon';

export {
  UpdateContentEvent,
  UpdateContentArgs,
  ContentUpdatedEvent,
  SpliceChildrenEvent,
  CONTENT_UPDATED_TAG,
} from './elements/events';
export { EveesDiff } from './elements/evees-diff';

/** UI support components */
export { prettyAddress } from './elements/support';
export { eveeColor, DEFAULT_COLOR } from './elements/support';

/** Patterns */
export { Secured, hashObject, deriveEntity } from './utils/cid-hash';
export { extractSignedEntity, deriveSecured, signObject } from './utils/signed';

/** Utils */
export { isAncestorOf } from './utils/ancestor';

/** Proposals */
export { Proposal, UpdateRequest, PROPOSAL_CREATED_TAG } from './types';
export { Proposals } from './services/proposals';

/** Aceess Control */
export { AccessControl } from './services/access-control';
export { RemoteLogged } from './services/remote.logged';
export { RemoteEvees } from './services/remote.evees';
export { RemoteWithUI } from './services/remote.with-ui';
