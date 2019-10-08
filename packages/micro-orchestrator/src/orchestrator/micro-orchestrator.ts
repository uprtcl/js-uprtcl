import { Container, AsyncContainerModule, interfaces, ContainerModule } from 'inversify';
import { MicroModule } from '../modules/micro.module';
import { ModuleContainer } from '../elements/module-container';
import { Logger } from '../utils/logger';
import { MicroOrchestratorTypes } from '../types';

export class MicroOrchestrator {
  container = new Container({ skipBaseClassChecks: true });

  constructor() {
    customElements.define('module-container', ModuleContainer(this.container));

    this.container
      .bind<Logger>(MicroOrchestratorTypes.Logger)
      .toDynamicValue((ctx: interfaces.Context) => {
        const logger = new Logger(ctx.plan.rootRequest.serviceIdentifier['name']);

        return logger;
      });
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
          await module.onLoad();

          const containerModule = new ContainerModule((...args) => module.onInit(...args));

          this.container.load(containerModule);
        } catch (e) {
          unloadedModules.push(microModule);
        }
      }
    }
  }
}
