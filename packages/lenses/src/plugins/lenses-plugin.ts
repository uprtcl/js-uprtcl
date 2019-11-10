import { Constructor } from '@uprtcl/micro-orchestrator';

import { CortexEntityBase } from '../elements/cortex-entity-base';

export type LensesPlugin<T extends CortexEntityBase> = (
  baseElement: Constructor<T>
) => Constructor<CortexEntityBase>;
