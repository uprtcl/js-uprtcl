export type ContentUpdatedArgs = {
  uref: string;
};

export type UpdateContentArgs = {
  dataId: string;
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

export const UPDATE_CONTENT_TAG = 'update-content';
export const SPLICE_CHILDREN_TAG = 'splice-children';
export const LIFT_CHILDREN_TAG = 'lift-children';
export const CONTENT_UPDATED_TAG = 'content-updated';

export class UpdateContentEvent extends CustomEvent<UpdateContentArgs> {
  constructor(init: CustomEventInit<UpdateContentArgs>) {
    super(UPDATE_CONTENT_TAG, init);
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
