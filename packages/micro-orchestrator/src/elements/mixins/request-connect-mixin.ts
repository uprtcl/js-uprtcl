import { Unsubscribe, Store } from 'redux';
import { Constructor, CustomElement } from './types';
import { interfaces } from 'inversify';
import { requestDeps } from './module-connect-mixin';

export const requestConnect = <S>(
  storeDependency: interfaces.ServiceIdentifier<any>,
  dependencies: Array<interfaces.ServiceIdentifier<any>>
) => <T extends Constructor<CustomElement>>(baseElement: T) =>
  class extends requestDeps([storeDependency, ...dependencies])(baseElement) {
    _storeUnsubscribe!: Unsubscribe;

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      const store: Store<S> = dependencies[0];

      this._storeUnsubscribe = store.subscribe(() => this.stateChanged(store.getState()));
    }

    disconnectedCallback() {
      this._storeUnsubscribe();

      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
    }

    /**
     * The `stateChanged(state)` method will be called when the state is updated.
     */
    stateChanged(_state: S) {}
  };
