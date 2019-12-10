import { Property } from '../pattern';

export interface CreateChild<T= any> extends Property<any> {
  createChild: (pattern: T) => (parent: any) => Promise<any>;
}
