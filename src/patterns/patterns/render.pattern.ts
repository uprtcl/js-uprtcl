import { Pattern } from '../pattern';

export interface RenderPattern<O> {
  render: (object: O) => Promise<any>;
}
