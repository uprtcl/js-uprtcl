import { Evees } from '../../../evees/src/evees/evees.service';
import { RequestDependencyEvent, RequestEveesEvent } from './multi.container';
import { Constructor, CustomElement } from './types';

export interface ConnectedElement {
  evees: Evees;
  request<T>(id: string): T;
  requestEvees(): Evees;
}

export const servicesConnect = <T extends Constructor<CustomElement>>(
  baseElement: T
): {
  new (...args: any[]): ConnectedElement;
  prototype: any;
} & T =>
  class extends baseElement implements ConnectedElement {
    evees!: Evees;

    connectedCallback() {
      super.connectedCallback();
      this.evees = this.requestEvees();
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

    requestEvees(): Evees {
      if (!this.isConnected) {
        throw new Error(
          `Element ${
            (this as any).tagName
          } is requesting the Evees service but is not connected: you can only use request() and requestAll() after the element has been initialized and connected to the DOM (e.g. firstUpdated() in LitElement)`
        );
      }

      const event = new RequestEveesEvent({
        detail: {},
        composed: true,
        bubbles: true,
      });

      const resolved = this.dispatchEvent(event);

      if (resolved && event.evees) {
        return event.evees;
      } else {
        throw new Error(
          `Evees services could not be loaded whenr requested by ${(this as any).tagName}`
        );
      }
    }
  };
