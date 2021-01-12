import { PatternRecognizer } from '@uprtcl/cortex';
import { CASStore } from '../services/cas/cas-store';
import { CASOnMemory } from '../services/cas/cas.memory';
import { CASRemote } from '../services/cas/cas-remote';

export const buildStore = (stores: CASRemote[]): CASStore => {
  return new CASOnMemory();
};
