import { Saga, SagaMiddleware } from 'redux-saga';
import { Store, ReducersMapObject, Action } from 'redux';
import { inject, interfaces, injectable } from 'inversify';
import { LazyStore } from 'pwa-helpers/lazy-reducer-enhancer';

import { MicroModule } from '../micro.module';
import { MicroOrchestratorTypes, ReduxTypes, Constructor } from '../../types';
import { ModuleProvider } from '../../orchestrator/module-provider';

export function reduxModule<S, A extends Action>(
  reducersMap: ReducersMapObject<S, A>,
  sagas: Saga[] = [],
  submodules: Constructor<MicroModule>[] = []
): any {
  @injectable()
  class ReduxModule implements MicroModule {
    constructor(
      @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
    ) {}

    submodules = submodules;

    async onLoad(
      context: interfaces.Context,
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): Promise<void> {
      await this.moduleProvider(ReduxTypes.Module);

      const store: Store & LazyStore = context.container.get(ReduxTypes.Store);
      store.addReducers(reducersMap as ReducersMapObject);

      const sagaMiddleware: SagaMiddleware = context.container.get(ReduxTypes.Saga);
      for (const saga of sagas) sagaMiddleware.run(saga);
    }

    async onUnload(): Promise<void> {}
  }

  return ReduxModule;
}
