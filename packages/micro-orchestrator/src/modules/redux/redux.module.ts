import { Dictionary } from 'lodash';
import { Action, Middleware, Reducer, Store } from 'redux';

import thunk from 'redux-thunk';

import { MicroModule } from '../micro.module';
import { StoreModule, REDUX_STORE_ID } from './store.module';

export class ReduxModule<S, A extends Action> implements MicroModule {
  store!: Store;

  constructor(
    protected reducerName: string,
    protected reducer: Reducer<S, A>,
    protected middlewares: Middleware<any, any, any>[] = []
  ) {}

  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {
    const storeModule: StoreModule = dependencies[REDUX_STORE_ID] as StoreModule;
    this.store = storeModule.getStore();

    const middlewares = this.getMiddlewares();

    storeModule.addReducer({
      [this.reducerName]: this.reducer as Reducer<S, Action<any>>
    });
    storeModule.addMiddlewares(middlewares);
  }

  getMiddlewares(): Middleware<any, any, any>[] {
    return [thunk];
  }

  getDependencies(): Array<string> {
    return [REDUX_STORE_ID];
  }

  getId(): string {
    return this.reducerName;
  }

  async onUnload(): Promise<void> {}

  getStore(): Store {
    return this.store;
  }
}
