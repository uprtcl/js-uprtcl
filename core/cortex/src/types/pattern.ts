import { Constructor } from '@uprtcl/micro-orchestrator';

import { Behaviour } from './behaviour';

/**
 * A pattern is a behaviour that a certain kind of object implements
 */
export abstract class Pattern<T> {
  constructor(public behaviourCreators: Array<Constructor<Behaviour<T>>>, create: boolean = true) {
    if (create) {
      this.behaviours = this.behaviourCreators.map((creator) => new creator());
    }
  }

  abstract recognize(object: any): boolean;

  abstract type: string | undefined;

  public behaviours: Array<Behaviour<T>> = [];
}
