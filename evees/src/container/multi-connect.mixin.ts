import { Evees } from '../evees/evees.service';
import { RequestEveesEvent } from './evees-container';
import { RequestDependencyEvent } from './multi.container';
import { Constructor, CustomElement } from './types';

export interface ConnectedElement {
  request<T>(id: string): T;
}

export const servicesConnect = <T extends Constructor<CustomElement>>(
  baseElement: T
): {
  new (...args: any[]): ConnectedElement;
  prototype: any;
} & T =>
  class extends baseElement implements ConnectedElement {
    connectedCallback() {
      super.connectedCallback();
    }

    request<T>(id: string): T {
      if (!this.isConnected) {
        throw new Error(
          `Element ${
            (this as any).tagName
          } is requesting the Evees service but is not connected: you can only use request() and requestAll() after the element has been initialized and connected to the DOM (e.g. firstUpdated() in LitElement)`
        );
      }

      const event = new RequestDependencyEvent({
        detail: { id },
        composed: true,
        bubbles: true,
      });

      const resolved = this.dispatchEvent(event);

      if (resolved && event.dependency) {
        return event.dependency;
      } else {
        throw new Error(`dependency ${id} could not be loaded`);
      }
    }
  };
