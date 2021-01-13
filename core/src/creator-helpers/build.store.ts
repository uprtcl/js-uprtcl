import { PatternRecognizer } from 'src/evees/elements/node_modules/src/evees/patterns/node_modules/src/evees/merge/node_modules/src/evees/behaviours/node_modules/@uprtcl/cortex';
import { CASStore } from '../cas/interfaces/cas-store';
import { CASOnMemory } from '../cas/stores/cas.memory';
import { CASRemote } from '../cas/interfaces/cas-remote';

export const buildStore = (stores: CASRemote[]): CASStore => {
  return new CASOnMemory();
};
