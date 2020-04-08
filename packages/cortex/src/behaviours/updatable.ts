import { Behaviour } from '../types/behaviour';

export interface Updatable<T> extends Behaviour<any> {
  update: (entityId: string) => (newContent: T) => Promise<void>;
}
