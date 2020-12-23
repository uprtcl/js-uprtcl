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

export class CheckDependencyEvent extends CustomEvent<{
  dependency: interfaces.ServiceIdentifier<any>;
}> {
  has: boolean = false;

  constructor(
    eventInitDict?: CustomEventInit<{
      dependency: interfaces.ServiceIdentifier<any>;
    }>
  ) {
    super('has-dependency', eventInitDict);
  }
}

export function ModuleContainer(container: Container): typeof HTMLElement {
  class ModuleContainer extends LitElement {
    container: any;

    constructor() {
      super();
      this.container = container;
    }

    connectedCallback() {
      super.connectedCallback();

      this.addEventListener<any>(
        'request-dependency',
        (e: RequestDependencyEvent) => {
          e.stopPropagation();

          const dependencyId = e.detail.request;
          const options = e.detail.options;

          if (this.container.isBound(dependencyId)) {
            if (options.multiple) {
              e.dependencies = this.container.getAll(dependencyId);
            } else {
              e.dependencies = [this.container.get(dependencyId)];
            }
          } else if (!options.optional) {
            throw new Error(
              `Trying to request a non-optional dependency that is not registered ${String(
                dependencyId
              )}`
            );
          }
        }
      );

      this.addEventListener<any>(
        'has-dependency',
        (e: CheckDependencyEvent) => {
          e.stopPropagation();
          const dependencyId = e.detail.dependency;
          e.has = this.container.isBound(dependencyId);
        }
      );
    }

    render() {
      return html` <slot></slot> `;
    }
  }

  return ModuleContainer;
}
