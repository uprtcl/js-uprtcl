export { EveesPerspectivesList } from './elements/evees-perspectives-list';
export { EveesBaseElement } from './elements/evees-base';
export { EveesBaseEditable, EditableCase } from './elements/evees-base-editable';
export { EveesInfoPopper, EveesInfoConfig } from './elements/evees-info-popper';
export { EveesInfoBase } from './elements/evees-info-base';
export { ProposalsList } from './elements/evees-proposals-list';
export { EveesPerspectiveIcon } from './elements/evees-perspective-icon';

export {
    UpdatePerspectiveEvent,
    ContentUpdatedEvent,
    SpliceChildrenEvent,
    ProposalCreatedEvent,
    NewPerspectiveEvent,
    CONTENT_UPDATED_TAG,
    PROPOSAL_CREATED_TAG,
    NEW_PERSPECTIVE_TAG,
    UPDATE_PERSPECTIVE_TAG,
  } from './elements/events';
  export { EveesDiffExplorer } from './elements/evees-diff-explorer';

/** UI support components */
export { prettyAddress } from './elements/support';
export { eveeColor, DEFAULT_COLOR } from './elements/support';

export { RemoteWithUI } from './interfaces/remote.with-ui';

export { HasLenses, Lens } from './behaviours/has-lenses';
export { RenderEntityInput } from './elements/uprtcl-entity';

export { servicesConnect } from './container/multi-connect.mixin';
export { eveesConstructorHelper } from './evees.constructor.helper';
export { MultiContainer } from './container/multi.container';
