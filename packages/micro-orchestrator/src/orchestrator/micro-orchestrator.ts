import { Container, interfaces } from 'inversify';

import { MicroModule } from './micro.module';
import { ModuleContainer } from '../elements/module-container';
import { Logger } from '../utils/logger';
import { MicroOrchestratorTypes, Dictionary } from '../types';
import { localModuleProvider, ModuleProvider } from './module-provider';

export class MicroOrchestrator {
  logger: Logger = new Logger('micro-orchestrator');
  container = new Container({ skipBaseClassChecks: true });

  loadingModules: Dictionary<Promise<MicroModule>> = {};

  constructor(protected moduleProvider: ModuleProvider = localModuleProvider) {
    customElements.define('module-container', ModuleContainer(this.container));

    this.container
      .bind<Logger>(MicroOrchestratorTypes.Logger)
      .toDynamicValue((ctx: interfaces.Context) => {
        const logger = new Logger(ctx.plan.rootRequest.serviceIdentifier['name']);

        return logger;
      });
  }

  /**
   * Loads the given modules
   * @param modules
   */
  public async loadModules(...modules: Array<MicroModule>): Promise<void> {
    const ids = Object.getOwnPropertySymbols(modules);

    for (const microModule of modules) {
      const id: string | undefined = Object.getPrototypeOf(microModule).id;
      if (id !== undefined) {
        this.container.bind<MicroModule>(id).toConstantValue(microModule);
      }
    }

    const promises = modules.map(microModule => this.loadModule(microModule));
    await Promise.all(promises);
  }

  /**
   * Loads the given module
   * @param microModule
   */
  public async loadModule(microModule: MicroModule): Promise<MicroModule> {
    // If the module has already been loaded (or is being loaded) return that promise
    const id: interfaces.ServiceIdentifier<any> | undefined = Object.getPrototypeOf(microModule).id;
    if (id && this.loadingModules[id as any]) return this.loadingModules[id as any];

    if (id) {
      this.logger.info(`Attempting to load module `, id);
    }

    // Load dependencies and submodules
    const dependencies = this.loadDependencies(microModule);
    const submodulesPromises = microModule.submodules.map(sub => this.loadModule(sub));

    await Promise.all([dependencies, Promise.all(submodulesPromises)]);

    // All dependencies and submodules have been loaded: load the microModule itself
    await microModule.onLoad(this.container);

    return microModule;
  }

  /** Private functions */

  /**
   * Loads all the dependencies for the given module, using the registered ModuleProvider to fetch the dependencies
   * @param microModule
   */
  private async loadDependencies(microModule: MicroModule): Promise<Array<MicroModule>> {
    const promises = microModule.dependencies.map(async dep => {
      const module = await this.moduleProvider(this.container)(dep);
      return this.loadModule(module);
    });

    return Promise.all(promises);
  }
}
