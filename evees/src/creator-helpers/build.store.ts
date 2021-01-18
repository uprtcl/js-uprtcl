import { CASStore } from '../cas/interfaces/cas-store';
import { CASOnMemory } from '../cas/stores/cas.memory';
import { CASRemote } from '../cas/interfaces/cas-remote';
import { CASRouter } from '../cas/stores/cas.router';

export const buildStore = (stores: CASRemote[]): CASStore => {
  const router = new CASRouter(stores);
  return new CASOnMemory(router);
};
