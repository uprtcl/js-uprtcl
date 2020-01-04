import { Property } from '../pattern';

export interface Creatable<A> extends Property<any> {
  create: () => (args: A | undefined, upl?: string) => Promise<string>;
}
