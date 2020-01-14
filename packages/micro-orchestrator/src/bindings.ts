export const MicroOrchestratorBindings = {
  Logger: Symbol('logger')
};

export const ReduxBindings = {
  Context: 'redux-saga-middleware-inversify-context',
  Store: Symbol('redux-store'),
  SagaMiddleware: Symbol('redux-saga-middleware')
};
