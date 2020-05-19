import { interfaces } from 'inversify';
import { Store } from 'redux';

import {
  Constructor,
  ConnectedElement,
  CustomElement,
  i18nextBaseModule,
  RequestDependencyEvent,
} from '@uprtcl/micro-orchestrator';

import { ReduxStoreModule } from './redux-store.module';

export interface ReduxConnectedElement extends ConnectedElement {
  store: Store;

  stateChanged(state: any): void;
}

export const reduxConnect = <T extends Constructor<CustomElement>>(
  baseElement: T
): {
  new (...args: any[]): ReduxConnectedElement;
  prototype: any;
} & T =>
  class extends baseElement implements ReduxConnectedElement {
    store!: Store;
    t: (key: string) => string = (key) => key;

    private requestGeneric<T>(
      dependency: interfaces.ServiceIdentifier<T>,
      multiple: boolean = false
    ): T[][] {
      if (!this.isConnected)
        throw new Error(
          'Element is not connected yet: you can only use request() and requestAll() after the element has been initialized and connected to the DOM (e.g. firstUpdated() in LitElement)'
        );

      const event = new RequestDependencyEvent({
        detail: { request: [dependency], multiple: multiple },
        composed: true,
        bubbles: true,
      });

      const resolved = this.dispatchEvent(event);

      if (
        resolved &&
        event.dependencies &&
        event.dependencies.length > 0 &&
        event.dependencies[0] &&
        event.dependencies[0][0]
      ) {
        return event.dependencies;
      } else {
        throw new Error(
          `Dependency ${String(dependency)} could not be loaded:
          make sure that this element is included inside a <module-container> super element`
        );
      }
    }

    request<T>(dependency: interfaces.ServiceIdentifier<T>): T {
      const deps = this.requestGeneric(dependency, false);
      return deps[0][0];
    }

    requestAll<T>(dependency: interfaces.ServiceIdentifier<T>): T[] {
      const deps = this.requestGeneric(dependency, true);
      return deps[0];
    }

    connectedCallback() {
      this.store = this.request(ReduxStoreModule.bindings.Store);

      super.connectedCallback();

      this.store.subscribe(() => this.stateChanged(this.store.getState()));
      this.stateChanged(this.store.getState());

      try {
        this.t = this.request(i18nextBaseModule.bindings.Translate);
      } catch (e) {
        console.warn('No translate function present');
      }
    }

    stateChanged(state: any) {}
  };
