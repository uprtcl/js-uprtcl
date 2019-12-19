import { Dictionary } from '@uprtcl/micro-orchestrator';

import { NodeList } from './node-list';

export const lenses: Dictionary<typeof HTMLElement> = {
  'node-list': NodeList
};
