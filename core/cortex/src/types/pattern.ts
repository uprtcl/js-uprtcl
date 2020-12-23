import { Constructor } from '@uprtcl/micro-orchestrator';

import { Behaviour } from './behaviour';

/**
 * A pattern is a behaviour that a certain kind of object implements
 */
export abstract class Pattern<T> {
  constructor(public behaviourCreators: Array<Constructor<Behaviour<T>>>) {}

  abstract recognize(object: any): boolean;

  abstract type: string | undefined;

  readonly behaviours: Array<Behaviour<T>> = [];
}
