import { Dictionary } from 'lodash';

export interface Implementation<T> extends Dictionary<(object: T) => any> {
  implements: (object: T) => boolean;
}
