import { Constructor, CustomElement } from './types';
import { RequestDependencyEvent } from '../module-container';
import { interfaces } from 'inversify';

export const moduleConnect = <T extends Constructor<CustomElement>>(baseElement: T) =>
  class extends baseElement {

    request(dependency: interfaces.ServiceIdentifier<any>) {
      const event = new RequestDependencyEvent({
        detail: { request: [dependency] },
        composed: true,
        bubbles: true
      });

      const resolved = this.dispatchEvent(event);

      if (resolved) {
        return event.dependencies[0];
      } else {
        throw new Error(
          'Dependencies could not be loaded: make sure that this element is included inside a <module-container> super element'
        );
      }
    }
  };
