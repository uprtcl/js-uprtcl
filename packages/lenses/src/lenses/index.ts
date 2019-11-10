import { Dictionary } from 'lodash';
import { NodeList } from './node-list';

export const lenses: Dictionary<typeof HTMLElement> = {
  'node-list': NodeList
};
