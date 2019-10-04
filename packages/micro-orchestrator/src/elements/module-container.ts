import { LitElement, html } from 'lit-element';
import { Container, interfaces } from 'inversify';

export class RequestDependencyEvent extends CustomEvent<{
  request: interfaces.ServiceIdentifier<any>[];
}> {
  dependencies!: any[];

  constructor(
    eventInitDict?: CustomEventInit<{
      request: interfaces.ServiceIdentifier<any>[];
    }>
  ) {
    super('request-dependency', eventInitDict);
  }
}

export function ModuleContainer(container: Container): typeof HTMLElement {
  class ModuleContainer extends LitElement {
    connectedCallback() {
      super.connectedCallback();

      this.addEventListener<any>('request-dependency', (e: RequestDependencyEvent) => {
        e.stopPropagation();
        e.dependencies = e.detail.request.map(dep => container.get(dep));
      });
    }

    render() {
      return html`
        <slot></slot>
      `;
    }
  }

  return ModuleContainer;
}
