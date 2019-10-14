import { Store, ReducersMapObject, Action, Reducer } from 'redux';
import { inject, interfaces, injectable } from 'inversify';
import { LazyStore } from 'pwa-helpers/lazy-reducer-enhancer';

import { MicroModule } from '../micro.module';
import { MicroOrchestratorTypes, ReduxTypes } from '../../types';
import { ModuleProvider } from '../../orchestrator/module-provider';

export function reduxModule<S, A extends Action>(reducersMap: ReducersMapObject<S, A>): any {
  @injectable()
  class ReduxModule implements MicroModule {
    constructor(
      @inject(MicroOrchestratorTypes.ModuleProvider) protected moduleProvider: ModuleProvider
    ) {}

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
    }

    async onUnload(): Promise<void> {}
  }

  return ReduxModule;
}
