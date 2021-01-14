import { CASStore } from '../cas/interfaces/cas-store';
import { CASOnMemory } from '../cas/stores/cas.memory';
import { CASRemote } from '../cas/interfaces/cas-remote';

export const buildStore = (stores: CASRemote[]): CASStore => {
  return new CASOnMemory();
};
