import { LitElement, html } from 'lit-element';
import { Evees } from '../services/evees.service';

export const REQUEST_EVEES_EVENT_TAG = 'request-evees-service';

export class RequestEveesEvent extends CustomEvent<{}> {
  evees!: Evees;

  constructor(eventInitDict?: CustomEventInit<{}>) {
    super(REQUEST_EVEES_EVENT_TAG, eventInitDict);
  }
}

export function EveesContainer(evees: Evees): typeof HTMLElement {
  class ModuleContainer extends LitElement {
    evees: Evees;

    constructor() {
      super();
      this.evees = evees;
    }

    connectedCallback() {
      super.connectedCallback();

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
