import { Behaviour } from '../types/behaviour';
import { Entity } from '../types/entity';

export interface Create<A, O> extends Behaviour<any> {
  create: () => (args: A, casID: string) => Promise<Entity<O>>;
}
