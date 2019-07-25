import { Dictionary } from 'lodash';
import { Action, Middleware, Reducer, Store } from 'redux';

import thunk from 'redux-thunk';

import { MicroModule } from '../micro.module';
import { StoreModule } from './store.module';

export class ReduxModule<S, A extends Action> implements MicroModule {
  store!: Store;

  constructor(
    protected reducerName: string,
    protected reducer: Reducer<S, A>,
    protected middlewares: Middleware<any, any, any>[] = []
  ) {}

  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {
    const storeModule: StoreModule = dependencies['redux-store'] as StoreModule;
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
    return ['redux-store'];
  }

  getId(): string {
    return `redux-reducer-${this.reducerName}`;
  }

  async onUnload(): Promise<void> {}

  getStore(): Store {
    return this.store;
  }
}
