import {
  Store,
  createStore,
  compose,
  combineReducers,
  applyMiddleware,
  StoreEnhancer,
} from 'redux';
import { LazyStore, lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import createSagaMiddleware, { SagaMiddleware } from 'redux-saga';
import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { ReduxBindings } from './bindings';

export class ReduxStoreModule extends MicroModule {
  static id = 'redux-store-module';

  static bindings = ReduxBindings;

  async onLoad(container: interfaces.Container): Promise<void> {
    if (container.isBound(ReduxStoreModule.bindings.Store)) return;

    const devCompose: <Ext0, Ext1, StateExt0, StateExt1>(
      f1: StoreEnhancer<Ext0, StateExt0>,
      f2: StoreEnhancer<Ext1, StateExt1>
    ) => StoreEnhancer<Ext0 & Ext1, StateExt0 & StateExt1> =
      window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose;
    const sagaMiddleware = createSagaMiddleware({
      context: { [ReduxBindings.Context]: container },
    });

    const store = createStore(
      (state, action) => state,
      devCompose(
        lazyReducerEnhancer(combineReducers),
        // TODO: add dynamic middlewares
        applyMiddleware(sagaMiddleware)
      )
    ) as Store & LazyStore;

    container.bind<Store & LazyStore>(ReduxStoreModule.bindings.Store).toConstantValue(store);
    container
      .bind<SagaMiddleware>(ReduxStoreModule.bindings.SagaMiddleware)
      .toConstantValue(sagaMiddleware);
  }
}
