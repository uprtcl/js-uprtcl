import { Saga, SagaMiddleware } from 'redux-saga';
import { Store, ReducersMapObject, Action } from 'redux';
import { inject, interfaces, injectable } from 'inversify';
import { LazyStore } from 'pwa-helpers/lazy-reducer-enhancer';

import { MicroModule } from '../micro.module';
import { MicroOrchestratorTypes, ReduxTypes } from '../../types';
import { ModuleProvider } from '../../orchestrator/module-provider';

@injectable()
export abstract class ReduxModule<S, A extends Action> implements MicroModule {
  constructor(
    @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
  ) {}

  abstract reducersMap: ReducersMapObject<S, A>;
  sagas: Saga[] | undefined = undefined;

  async onLoad(
    context: interfaces.Context,
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ): Promise<void> {
    await this.moduleProvider(ReduxTypes.Module);

    const store: Store & LazyStore = context.container.get(ReduxTypes.Store);
    store.addReducers(this.reducersMap as ReducersMapObject);

    if (this.sagas) {
      const sagaMiddleware: SagaMiddleware = context.container.get(ReduxTypes.Saga);
      for (const saga of this.sagas) sagaMiddleware.run(saga);
    }
  }

}
