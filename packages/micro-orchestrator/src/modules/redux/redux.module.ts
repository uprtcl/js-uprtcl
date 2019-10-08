import { Store, ReducersMapObject, Action, Reducer } from 'redux';
import { inject, interfaces, injectable } from 'inversify';
import { LazyStore } from 'pwa-helpers/lazy-reducer-enhancer';

import { MicroModule } from '../micro.module';
import { MicroOrchestratorTypes } from '../../types';

export function reduxModule<S, A extends Action>(reducersMap: ReducersMapObject<S, A>): any {
  @injectable()
  class ReduxModule implements MicroModule {
    constructor(@inject(MicroOrchestratorTypes.ReduxStore) protected store: Store & LazyStore) {}
    async onLoad() {}

    onInit(
      bind: interfaces.Bind,
      unbind: interfaces.Unbind,
      isBound: interfaces.IsBound,
      rebind: interfaces.Rebind
    ): void {
      this.store.addReducers(reducersMap as ReducersMapObject);
    }

    async onUnload(): Promise<void> {}
  }

  return ReduxModule;
}
