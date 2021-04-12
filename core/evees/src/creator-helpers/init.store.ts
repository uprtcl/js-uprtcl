import { CASStore } from '../cas/interfaces/cas-store';
import { CASRemote } from '../cas/interfaces/cas-remote';
import { CASRouter } from '../cas/stores/cas.router';
import { CASOnMemory } from '../cas/stores/cas.memory';

export const initStore = (
  stores: CASRemote[],
  remoteToSourcesMap: Map<string, string>
): CASStore => {
  const router = new CASRouter(stores, remoteToSourcesMap);
  return new CASOnMemory(router);
};
