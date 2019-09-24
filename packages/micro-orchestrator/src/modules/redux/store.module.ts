import {
  Store,
  createStore,
  compose,
  combineReducers,
  applyMiddleware,
  Middleware,
  ReducersMapObject,
  AnyAction,
  StoreEnhancer
} from 'redux';
import { LazyStore, lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk, { ThunkMiddleware } from 'redux-thunk';

import { MicroModule } from '../micro.module';

export const REDUX_STORE_ID = 'redux-store-module';

export class StoreModule implements MicroModule {
  store!: Store & LazyStore;

  async onLoad(): Promise<void> {

    const devCompose: <Ext0, Ext1, StateExt0, StateExt1>(
      f1: StoreEnhancer<Ext0, StateExt0>,
      f2: StoreEnhancer<Ext1, StateExt1>
    ) => StoreEnhancer<Ext0 & Ext1, StateExt0 & StateExt1> =
      window['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose;

    this.store = createStore(
      (state, action) => state,
      devCompose(
        lazyReducerEnhancer(combineReducers),
        // TODO: add dynamic middlewares
        applyMiddleware(thunk as ThunkMiddleware<any, AnyAction>)
      )
    ) as Store & LazyStore;
  }

  addReducer(reducers: ReducersMapObject): void {
    this.store.addReducers(reducers);
  }

  async onUnload(): Promise<void> {}

  getDependencies(): string[] {
    return [];
  }

  getId(): string {
    return REDUX_STORE_ID;
  }

  getStore(): Store {
    return this.store;
  }
}
