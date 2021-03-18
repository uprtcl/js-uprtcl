import { Entity } from '../../cas/interfaces/entity';
import { CreateEvee, NewPerspective, UpdatePerspectiveData } from '../interfaces/types';
import { Proposal } from '../proposals/types';

export type ContentUpdatedArgs = {
  uref: string;
};

export type SpliceChildrenArgs = {
  startedOnElementId: string;
  elements: any[];
  index?: number;
  toIndex?: number;
  appendBackwards?: string;
  liftBackwards?: string[];
  focusAfter?: number;
};

export type LiftChildrenArgs = {
  startedOnElementId: string;
  index: number;
  toIndex: number;
};

export interface ProposalCreatedDetail {
  remote: string;
  proposal: Proposal;
}

export const UPDATE_PERSPECTIVE_DATA_TAG = 'update-perspective-data';
export const CREATE_PERSPECTIVE_TAG = 'create-perspective';
export const CREATE_ENTITY_TAG = 'create-entity';

export const SPLICE_CHILDREN_TAG = 'splice-children';
export const LIFT_CHILDREN_TAG = 'lift-children';
export const CONTENT_UPDATED_TAG = 'content-updated';
export const PROPOSAL_CREATED_TAG: string = 'evees-proposal';

export class ProposalCreatedEvent extends CustomEvent<ProposalCreatedDetail> {
  constructor(eventInitDict?: CustomEventInit<ProposalCreatedDetail>) {
    super(PROPOSAL_CREATED_TAG, eventInitDict);
  }
}

export class UpdatePerspectiveDataEvent extends CustomEvent<UpdatePerspectiveData> {
  constructor(init: CustomEventInit<UpdatePerspectiveData>) {
    super(UPDATE_PERSPECTIVE_DATA_TAG, init);
  }
}

export class CreatePerspectiveEvent extends CustomEvent<CreateEvee> {
  constructor(init: CustomEventInit<CreateEvee>) {
    super(CREATE_PERSPECTIVE_TAG, init);
  }
}

export class CreateEntityEvent extends CustomEvent<Entity> {
  constructor(init: CustomEventInit<Entity>) {
    super(CREATE_ENTITY_TAG, init);
  }
}

export class SpliceChildrenEvent extends CustomEvent<SpliceChildrenArgs> {
  constructor(init: CustomEventInit<SpliceChildrenArgs>) {
    super(SPLICE_CHILDREN_TAG, init);
  }
}

export class LiftChildrenEvent extends CustomEvent<LiftChildrenArgs> {
  constructor(init: CustomEventInit<LiftChildrenArgs>) {
    super(LIFT_CHILDREN_TAG, init);
  }
}

export class ContentUpdatedEvent extends CustomEvent<ContentUpdatedArgs> {
  constructor(init: CustomEventInit<ContentUpdatedArgs>) {
    super(CONTENT_UPDATED_TAG, init);
  }
}
