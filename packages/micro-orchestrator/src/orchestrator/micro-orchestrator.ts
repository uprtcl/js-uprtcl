import { Container, AsyncContainerModule, interfaces } from 'inversify';
import { MicroModule } from '../modules/micro.module';
import { ModuleContainer } from '../elements/module-container';

export class MicroOrchestrator {
  container = new Container();

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

    let unloadedModules = modules;
    let i = 0;
    while (unloadedModules.length > 0 && i < 10) {
      i++;
      const modulesToLoad = unloadedModules.reverse();
      unloadedModules = [];

      for (const microModule of modulesToLoad) {
        try {
          const module: MicroModule = this.container.get(microModule);

          const asyncModule = new AsyncContainerModule((...args) => module.onLoad(...args));

          await this.container.loadAsync(asyncModule);
        } catch (e) {
          unloadedModules.push(microModule);
        }
      }
    }
  }

  async loadModule<T extends MicroModule>(microModule: new (...args: any[]) => T): Promise<void> {
    this.container.bind<T>(microModule).toSelf();
    const module: T = this.container.get(microModule);

    const asyncModule = new AsyncContainerModule(module.onLoad);

    return this.container.loadAsync(asyncModule);
  }
}
