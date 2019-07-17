import { Pattern } from './pattern';

export interface RenderPattern<O> {
  render: (object: O) => Promise<any>;
}

export class DataRenderPattern implements Pattern, RenderPattern<any> {
  recognize() {
    return true;
  }

  render = (object: object) => Promise.resolve(object);
}
