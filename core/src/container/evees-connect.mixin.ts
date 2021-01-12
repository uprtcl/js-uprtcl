import { Evees } from '../evees/evees.service';
import { RequestEveesEvent } from './evees-container';
import { Constructor, CustomElement } from './types';

export interface EveesConnectedElement {
  evees: Evees;
  requestEvees(): Evees;
}

export const eveesConnect = <T extends Constructor<CustomElement>>(
  baseElement: T
): {
  new (...args: any[]): EveesConnectedElement;
  prototype: any;
} & T =>
  class extends baseElement implements EveesConnectedElement {
    evees!: Evees;

    connectedCallback() {
      super.connectedCallback();
      this.evees = this.requestEvees();
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
        throw new Error(`Evees services could not be loaded`);
      }
    }
  };
