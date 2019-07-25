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
const { createDynamicMiddlewares } = require('redux-dynamic-middlewares');

import { MicroModule } from '../micro.module';

export class StoreModule implements MicroModule {
  store!: Store & LazyStore;
  dynamicMiddlewareInstance: any;

  async onLoad(): Promise<void> {
    const dynamicMiddlewaresInstance = createDynamicMiddlewares();

    this.store = createStore(
      (state, action) => state,
      compose(
        lazyReducerEnhancer(combineReducers),
        applyMiddleware(dynamicMiddlewaresInstance)
      )
    ) as Store & LazyStore;
  }

  addMiddlewares(middlewares: Middleware<any, any, any>[]): void {
    this.dynamicMiddlewareInstance.addMiddleware(middlewares);
  }

  addReducer(reducers: ReducersMapObject): void {
    this.store.addReducers(reducers);
  }

  async onUnload(): Promise<void> {}

  getDependencies(): string[] {
    return [];
  }

  getId(): string {
    return 'redux-store';
  }

  getStore(): Store {
    return this.store;
  }
}
