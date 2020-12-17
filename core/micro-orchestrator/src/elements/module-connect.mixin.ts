import { interfaces } from 'inversify';

import { RequestDependencyEvent } from './module-container';
import { Constructor, CustomElement } from '../types';
import { i18nextBaseModule } from '../modules/i18n/i18next-base.module';

export interface ConnectedElement {
  t: (key: string) => string;
  request<T>(dependency: interfaces.ServiceIdentifier<T>, options?: { optional: boolean }): T;
  requestAll<T>(dependency: interfaces.ServiceIdentifier<T>, options?: { optional: boolean }): T[];
}

export const moduleConnect = <T extends Constructor<CustomElement>>(
  baseElement: T
): {
  new (...args: any[]): ConnectedElement;
  prototype: any;
} & T =>
  class extends baseElement implements ConnectedElement {
    t: (key: string) => string = (key) => key;

    connectedCallback() {
      super.connectedCallback();

      try {
        this.t = this.request(i18nextBaseModule.bindings.Translate, { optional: true });
      } catch (e) {
        console.warn('No translate function present');
      }
    }

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
  };
