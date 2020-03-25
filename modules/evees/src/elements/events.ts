export type ContentUpdatedArgs = {
  perspectiveId: string;
};

export type UpdateContentArgs = {
  dataId: string;
};

export type CreateSyblingArgs = {
  startedOnElementId: string;
  object: object;
  symbol: symbol;
  index?: number;
};

export type AddSyblingsArgs = {
  startedOnElementId: string;
  index?: number;
  elementIds: string[];
};

export type RemoveSyblingsArgs = {
  startedOnElementId: string;
  fromIndex?: number;
  toIndex?: number;
};

export type RemoveChildArgs = {
  startedOnElementId: string;
  index: number;
}

export const CREATE_SYBLING_TAG = 'create-sybling';
export const ADD_SYBLINGS_TAG = 'add-syblings';
export const REMOVE_CHILDREN_TAG = 'remove-children';
export const UPDATE_CONTENT_TAG = 'update-content';
export const CONTENT_UPDATED_TAG = 'content-updated';
export const REMOVE_CHILD_TAG = 'remove-child';

export class UpdateContentEvent extends CustomEvent<UpdateContentArgs> {
  constructor(init: CustomEventInit<UpdateContentArgs>) {
    super(UPDATE_CONTENT_TAG, init);
  }
}

export class CreateSyblingEvent extends CustomEvent<CreateSyblingArgs> {
  constructor(init: CustomEventInit<CreateSyblingArgs>) {
    super(CREATE_SYBLING_TAG, init);
  }
}

export class AddSyblingsEvent extends CustomEvent<AddSyblingsArgs> {
  constructor(init: CustomEventInit<AddSyblingsArgs>) {
    super(ADD_SYBLINGS_TAG, init);
  }
}

export class RemoveChildrenEvent extends CustomEvent<RemoveSyblingsArgs> {
  constructor(init: CustomEventInit<RemoveSyblingsArgs>) {
    super(REMOVE_CHILDREN_TAG, init);
  }
}

export class ContentUpdatedEvent extends CustomEvent<ContentUpdatedArgs> {
  constructor(init: CustomEventInit<ContentUpdatedArgs>) {
    super(CONTENT_UPDATED_TAG, init);
  }
}

export class RemoveChildEvent extends CustomEvent<RemoveChildArgs> {
  constructor(init: CustomEventInit<RemoveChildArgs>) {
    super(REMOVE_CHILD_TAG, init);
  }
}






