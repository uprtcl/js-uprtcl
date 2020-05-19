import { LitElement, html } from 'lit-element';
import { Container, interfaces } from 'inversify';

export interface RequestDependencyOptions {
  multiple: boolean;
  optional: boolean;
}

export class RequestDependencyEvent extends CustomEvent<{
  request: interfaces.ServiceIdentifier<any>;
  options: RequestDependencyOptions;
}> {
  dependencies!: any[];

  constructor(
    eventInitDict?: CustomEventInit<{
      request: interfaces.ServiceIdentifier<any>;
      options: RequestDependencyOptions;
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

        const dependencyId = e.detail.request;
        const options = e.detail.options;

        if (container.isBound(dependencyId)) {
          if (options.multiple) {
            e.dependencies = container.getAll(dependencyId);
          } else {
            e.dependencies = [container.get(dependencyId)];
          }
        } else if (!options.optional) {
          throw new Error(
            `Trying to request a non-optional dependency that is not registered ${String(
              dependencyId
            )}`
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
