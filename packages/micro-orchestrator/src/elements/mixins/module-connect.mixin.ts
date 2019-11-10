import { interfaces } from 'inversify';
import { RequestDependencyEvent } from '../module-container';
import { Constructor, CustomElement } from '../../types';

export interface ConnectedElement {
  request<T>(dependency: interfaces.ServiceIdentifier<T>): T;
}

export const moduleConnect = <T extends Constructor<CustomElement>>(
  baseElement: T
): {
  new (...args: any[]): ConnectedElement;
  prototype: any;
} & T =>
  class extends baseElement implements ConnectedElement {
    request<T>(dependency: interfaces.ServiceIdentifier<T>): T {
      const event = new RequestDependencyEvent({
        detail: { request: [dependency] },
        composed: true,
        bubbles: true
      });

      const resolved = this.dispatchEvent(event);

      if (
        resolved &&
        event.dependencies &&
        event.dependencies.length > 0 &&
        event.dependencies[0]
      ) {
        return event.dependencies[0];
      } else {
        throw new Error(
          `Dependency ${String(dependency)} could not be loaded:
          make sure that this element is included inside a <module-container> super element`
        );
      }
    }
  };
