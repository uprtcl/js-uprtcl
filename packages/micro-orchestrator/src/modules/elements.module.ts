import { MicroModule } from '../orchestrator/micro.module';
import { Constructor, Dictionary } from '../types';

export class ElementsModule extends MicroModule {
  constructor(protected elements: Dictionary<Constructor<HTMLElement>>) {
    super();
  }

  async onLoad(): Promise<void> {
    const tags = Object.keys(this.elements);

    tags.forEach(async tag => {
      const element = this.elements[tag];
      customElements.define(tag, element);
    });
  }
}
