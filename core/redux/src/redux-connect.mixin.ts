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
      options: { multiple: boolean; optional: boolean }
    ): T[] {
      if (!this.isConnected) {
        throw new Error(
          `Element ${
            (this as any).tagName
          } is requesting dependency "${dependency.toString()}", but is not connected yet: you can only use request() and requestAll() after the element has been initialized and connected to the DOM (e.g. firstUpdated() in LitElement)`
        );
      }

      const event = new RequestDependencyEvent({
        detail: { request: dependency, options },
        composed: true,
        bubbles: true,
      });

      const resolved = this.dispatchEvent(event);

      if (
        resolved &&
        event.dependencies &&
        event.dependencies.length > 0 &&
        event.dependencies[0] !== undefined
      ) {
        return event.dependencies;
      } else {
        throw new Error(
          `Dependency ${String(dependency)} could not be loaded:
          make sure that this element is included inside a <module-container> super element and the dependency exists`
        );
      }
    }

    request<T>(
      dependency: interfaces.ServiceIdentifier<T>,
      options: { optional: boolean } = { optional: false }
    ): T {
      const deps = this.requestGeneric(dependency, { optional: options.optional, multiple: false });
      return deps[0];
    }

    requestAll<T>(
      dependency: interfaces.ServiceIdentifier<T>,
      options: { optional: boolean } = { optional: false }
    ): T[] {
      const deps = this.requestGeneric(dependency, { optional: options.optional, multiple: true });
      return deps;
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
