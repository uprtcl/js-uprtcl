import { Property } from '../pattern';

export interface Updatable<T> extends Property<any> {
  update: (entityId: string) => (newContent: T) => Promise<void>;
}
