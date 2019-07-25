import { MicroModule } from './micro.module';
import { Constructor } from '../types';
import { Dictionary } from 'lodash';

export class ElementsModule implements MicroModule {
  constructor(
    protected moduleName: string,
    protected elements: Dictionary<Constructor<HTMLElement>>
  ) {}

  async onLoad(): Promise<void> {
    const tags = Object.keys(this.elements);

    tags.forEach(async tag => {
      const element = this.elements[tag];
      customElements.define(tag, element);
    });
  }

  async onUnload(): Promise<void> {}
  getDependencies(): string[] {
    return [];
  }
  getId(): string {
    return `elements-${this.moduleName}`;
  }
}
