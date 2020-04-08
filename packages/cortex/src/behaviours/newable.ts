import { Entity } from '../types/entity';

export interface Newable<A, T> {
  new: () => (args: A, recipe: any) => Promise<Entity<T>>;
}
