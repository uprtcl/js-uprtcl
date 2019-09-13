import {
  Store,
  createStore,
  compose,
  combineReducers,
  applyMiddleware,
  Middleware,
  ReducersMapObject
} from 'redux';
import { LazyStore, lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import { createDynamicMiddlewares } from 'redux-dynamic-middlewares';

import { MicroModule } from '../micro.module';

export const REDUX_STORE_ID = 'redux-store-module';

export class StoreModule implements MicroModule {
  store!: Store & LazyStore;
  dynamicMiddlewaresInstance: any;

  async onLoad(): Promise<void> {
    this.dynamicMiddlewaresInstance = createDynamicMiddlewares();

    this.store = createStore(
      (state, action) => state,
      compose(
        lazyReducerEnhancer(combineReducers),
        applyMiddleware(this.dynamicMiddlewaresInstance.enhancer)
      )
    ) as Store & LazyStore;
  }

  addMiddlewares(middlewares: Middleware<any, any, any>[]): void {
    this.dynamicMiddlewaresInstance.addMiddleware(middlewares);
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
