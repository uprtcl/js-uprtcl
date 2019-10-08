export type Constructor<T, A = any[]> = new (args: A) => T;

export const MicroOrchestratorTypes = {
  ReduxStore: Symbol('redux-store'),
  Logger: Symbol('logger'),
};
