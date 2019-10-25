import { Constructor } from '@uprtcl/micro-orchestrator';
import { CortexEntityBase } from './cortex-entity-base';

export type Plugin<T extends CortexEntityBase> = (
  baseElement: Constructor<T>
) => Constructor<CortexEntityBase>;
