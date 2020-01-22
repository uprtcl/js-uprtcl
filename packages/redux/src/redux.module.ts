import { Saga, SagaMiddleware } from 'redux-saga';
import { Store, ReducersMapObject, Action } from 'redux';
import { interfaces } from 'inversify';
import { LazyStore } from 'pwa-helpers/lazy-reducer-enhancer';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { ReduxStoreModule } from './redux-store.module';

export class ReduxModule<S, A extends Action> extends MicroModule {
  constructor(
    protected reducersMap: ReducersMapObject<S, A>,
    protected sagas: Saga[] | undefined = undefined
  ) {
    super();
  }

  dependencies = [ReduxStoreModule.id];

  async onLoad(container: interfaces.Container): Promise<void> {
    const store: Store & LazyStore = container.get(ReduxStoreModule.bindings.Store);
    store.addReducers(this.reducersMap as ReducersMapObject);

    if (this.sagas) {
      const sagaMiddleware: SagaMiddleware = container.get(
        ReduxStoreModule.bindings.SagaMiddleware
      );
      for (const saga of this.sagas) sagaMiddleware.run(saga);
    }
  }
}
