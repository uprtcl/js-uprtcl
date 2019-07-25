export type Selector<S> = (...args: any[]) => Selector<S> | ((state: S) => any);

type Tree<L> = {
  [key: string]: L | Tree<L>;
};

export type Selectors<S> = Tree<Selector<S>>;

export interface TypedActionCreator<A, T> {
  (args: T): A;
}
