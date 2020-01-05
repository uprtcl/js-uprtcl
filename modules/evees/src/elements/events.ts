export type UpdateContentArgs = {
  dataId: string;
};

export class UpdateContentEvent extends CustomEvent<UpdateContentArgs> {
  dependencies!: any[];

  constructor(eventInitDict?: CustomEventInit<UpdateContentArgs>) {
    super('update-content', eventInitDict);
  }
}
