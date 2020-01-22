import { interfaces } from 'inversify';

import { RequestDependencyEvent } from './module-container';
import { Constructor, CustomElement } from '../types';
import { i18nextBaseModule } from '../modules/i18n/i18next-base.module';

export interface ConnectedElement {
  t: (key: string) => string;
  request<T>(dependency: interfaces.ServiceIdentifier<T>): T;
  requestAll<T>(dependency: interfaces.ServiceIdentifier<T>): T[];
}

export const moduleConnect = <T extends Constructor<CustomElement>>(
  baseElement: T
): {
  new (...args: any[]): ConnectedElement;
  prototype: any;
} & T =>
  class extends baseElement implements ConnectedElement {
    t: (key: string) => string = key => key;
    translate2: (key: string) => string = key => key;

    connectedCallback() {
      super.connectedCallback();

      try {
        this.t = this.request(i18nextBaseModule.bindings.Translate);
      } catch (e) {
        console.warn('No translate function present');
      }
    }

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
        bubbles: true
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
  };
