import { Container, AsyncContainerModule, interfaces } from 'inversify';
import { MicroModule } from '../modules/micro.module';
import { ModuleContainer } from '../elements/module-container';

export class MicroOrchestrator {
  container = new Container({ defaultScope: 'Singleton' });

  constructor() {
    customElements.define('module-container', ModuleContainer(this.container));
  }

  /**
   * Loads the given modules to the available module list
   * @param modules
   */
  async loadModules(...modules: Array<new (...args: any[]) => MicroModule>): Promise<void> {
    for (const microModule of modules) {
      this.container.bind(microModule).toSelf();
    }
    console.log('hi', this.container);
    for (const microModule of modules) {
      console.log('hi1', microModule);
      const module: MicroModule = this.container.get(microModule);
      console.log('hi2', module);

      const asyncModule = new AsyncContainerModule(
        (
          bind: interfaces.Bind,
          unbind: interfaces.Unbind,
          isBound: interfaces.IsBound,
          rebind: interfaces.Rebind
        ) => module.onLoad(bind, unbind, isBound, rebind)
      );
      console.log('hi3', asyncModule);

      await this.container.loadAsync(asyncModule);
      console.log('hi4', this.container);
    }
  }

  async loadModule<T extends MicroModule>(microModule: new (...args: any[]) => T): Promise<void> {
    this.container.bind<T>(microModule).toSelf();
    const module: T = this.container.get(microModule);

    const asyncModule = new AsyncContainerModule(module.onLoad);

    return this.container.loadAsync(asyncModule);
  }
}
