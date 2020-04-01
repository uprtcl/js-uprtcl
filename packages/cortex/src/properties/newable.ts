export interface Newable<A, T> {
  new: () => (args: A, recipe: any) => Promise<[string, T]>;
}
