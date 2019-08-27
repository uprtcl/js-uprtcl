export interface RenderPattern<O> {
  render: (object: O) => Promise<any>;
}
