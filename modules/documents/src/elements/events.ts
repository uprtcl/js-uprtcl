export type CreateSyblingArgs = {
  startedOnElementId: string,
  index?: number;
};

export type AddSyblingsArgs = {
  startedOnElementId: string,
  index?: number;
  elementIds: string[];
};

export type RemoveSyblingsArgs = {
  startedOnElementId: string,
  fromIndex?: number;
  toIndex?: number;
};

export class CreateSyblingEvent extends CustomEvent<CreateSyblingArgs> {
  constructor(init: CustomEventInit<CreateSyblingArgs>) {
    super('create-sybling', init);
  }
}

export class AddSyblingsEvent extends CustomEvent<AddSyblingsArgs> {
  constructor(init: CustomEventInit<AddSyblingsArgs>) {
    super('add-syblings', init);
  }
}

export class RemoveChildrenEvent extends CustomEvent<RemoveSyblingsArgs> {
  constructor(init: CustomEventInit<RemoveSyblingsArgs>) {
    super('remove-syblings', init);
  }
}


