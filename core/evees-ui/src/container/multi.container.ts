import { LitElement, html } from 'lit-element';

import { Evees } from '../../../evees/src/evees/evees.service';

export const REQUEST_EVEES_EVENT_TAG = 'request-evees-service';
export const REQUEST_EVENT_TAG = 'request-dependency';

export interface RequestDependencyEventDetail {
  id: string;
}
export class RequestDependencyEvent extends CustomEvent<RequestDependencyEventDetail> {
  dependency!: any;

  constructor(eventInitDict?: CustomEventInit<RequestDependencyEventDetail>) {
    super(REQUEST_EVENT_TAG, eventInitDict);
  }
}

export class RequestEveesEvent extends CustomEvent<{}> {
  evees!: Evees;

  constructor(eventInitDict?: CustomEventInit<{}>) {
    super(REQUEST_EVEES_EVENT_TAG, eventInitDict);
  }
}

/** An web component that holds the different services and serves them to children
 * components though a DOM event */
export function MultiContainer(evees: Evees, services?: Map<string, any>): typeof HTMLElement {
  class ModuleContainer extends LitElement {
    evees: Evees;
    services: Map<string, any> | undefined;

    constructor() {
      super();
      this.services = services;
      this.evees = evees;
    }

    connectedCallback() {
      super.connectedCallback();

      this.addEventListener<any>(REQUEST_EVENT_TAG, (e: RequestDependencyEvent) => {
        e.stopPropagation();
        if (!this.services) throw new Error('Services are undefined');
        e.dependency = this.services.get(e.detail.id);
      });

      this.addEventListener<any>(REQUEST_EVEES_EVENT_TAG, (e: RequestEveesEvent) => {
        e.stopPropagation();
        e.evees = this.evees;
      });
    }

    render() {
      return html` <slot></slot> `;
    }
  }

  return ModuleContainer;
}
