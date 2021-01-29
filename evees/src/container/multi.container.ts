import { LitElement, html } from 'lit-element';

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

/** An web component that holds the different services and serves them to children
 * components though a DOM event */
export function MultiContainer(services: Map<string, any>): typeof HTMLElement {
  class ModuleContainer extends LitElement {
    services: Map<string, any>;

    constructor() {
      super();
      this.services = services;
    }

    connectedCallback() {
      super.connectedCallback();

      this.addEventListener<any>(REQUEST_EVENT_TAG, (e: RequestDependencyEvent) => {
        e.stopPropagation();
        e.dependency = this.services.get(e.detail.id);
      });
    }

    render() {
      return html` <slot></slot> `;
    }
  }

  return ModuleContainer;
}
