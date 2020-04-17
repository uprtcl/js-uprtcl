import { LitElement, html } from 'lit-element';
import { Container, interfaces } from 'inversify';

export class RequestDependencyEvent extends CustomEvent<{
  request: interfaces.ServiceIdentifier<any>[];
  multiple?: boolean;
}> {
  dependencies!: any[];

  constructor(
    eventInitDict?: CustomEventInit<{
      request: interfaces.ServiceIdentifier<any>[];
      multiple?: boolean;
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

        debugger

        try {
          if (e.detail.multiple)
            e.dependencies = e.detail.request.map((dep) => container.getAll(dep));
          else e.dependencies = e.detail.request.map((dep) => [container.get(dep)]);
        } catch (error) {
          console.warn(
            'Trying to request a dependency that is not registered ',
            e.dependencies,
            ' error: ',
            error
          );
        }
      });
    }

    render() {
      return html` <slot></slot> `;
    }
  }

  return ModuleContainer;
}
