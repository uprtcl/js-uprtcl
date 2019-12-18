import { Dictionary, Constructor } from '@uprtcl/micro-orchestrator';

import { NodeList } from './node-list';

export const lenses: Dictionary<Constructor<HTMLElement>> = {
  'node-list': NodeList
};
