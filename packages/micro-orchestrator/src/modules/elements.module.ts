import { MicroModule } from './micro.module';
import { Constructor } from '../types';
import { Dictionary } from 'lodash';
import { injectable } from 'inversify';

@injectable()
export abstract class ElementsModule implements MicroModule {
  abstract get elements(): Dictionary<Constructor<HTMLElement>>;

  constructor() {}

  async onLoad(): Promise<void> {
    const tags = Object.keys(this.elements);

    tags.forEach(async tag => {
      const element = this.elements[tag];
      customElements.define(tag, element);
    });
  }
}

export function elementsModule(
  elements: Dictionary<Constructor<HTMLElement>>
): Constructor<MicroModule> {
  @injectable()
  class ElementsModuleInstance extends ElementsModule {
    get elements() {
      return elements;
    }
  }

  return ElementsModuleInstance;
}
