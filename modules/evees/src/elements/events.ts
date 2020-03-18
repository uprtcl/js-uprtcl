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

export const CREATE_SYBLING_TAG = 'create-sybling';
export const ADD_SYBLINGS_TAG = 'add-syblings';
export const REMOVE_CHILDREN_TAG = 'remove-children';
export const UPDATE_CONTENT_TAG = 'update-content';

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



