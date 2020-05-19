import { Container, interfaces } from 'inversify';

import { MicroModule } from './micro.module';
import { ModuleContainer } from '../elements/module-container';
import { Logger } from '../utils/logger';
import { Dictionary } from '../types';
import { MicroOrchestratorBindings } from '../bindings';
import { localModuleProvider, ModuleProvider } from './module-provider';

export class MicroOrchestrator {
  logger: Logger = new Logger('micro-orchestrator');
  container = new Container({ skipBaseClassChecks: true });

  // Dictionary holding the promises of the modules being loaded, to deduplicate modules with equal id
  loadingModules: Dictionary<Promise<any>> = {};

  constructor(protected moduleProvider: ModuleProvider = localModuleProvider) {
    if (customElements.get('module-container')) {
      console.warn(
        `Could not define <module-container> since it is already present in the customElements registry, assuming that both module-containers contain the same container instance...`
      );
    } else {
      customElements.define('module-container', ModuleContainer(this.container));
    }

    this.container
      .bind<Logger>(MicroOrchestratorBindings.Logger)
      .toDynamicValue((ctx: interfaces.Context) => {
        const logger = new Logger(ctx.plan.rootRequest.serviceIdentifier['name']);

        return logger;
      });
  }

  /**
   * Loads the given modules
   * @param modules
   */
  public async loadModules(modules: Array<MicroModule>): Promise<void> {
    for (const microModule of modules) {
      const id: interfaces.ServiceIdentifier<any> | undefined = this.idFromInstance(microModule);
      if (id !== undefined) {
        this.container.bind<MicroModule>(id).toConstantValue(microModule);
      }
    }

    const promises = modules.map((microModule) => this.loadModule(microModule));
    await Promise.all(promises);
  }

  /**
   * Loads the given module
   * @param microModule
   */
  public async loadModule(microModule: MicroModule): Promise<void> {
    // If the module has already been loaded (or is being loaded) return that promise
    const id: interfaces.ServiceIdentifier<any> | undefined = this.idFromInstance(microModule);

    if (id && this.loadingModules[id as any]) return this.loadingModules[id as any];

    if (id) {
      this.logger.info(`Attempting to load module ${id.toString()}`);
    }

    // Load dependencies and submodules
    const dependencies = this.loadDependencies(microModule);
    const submodulesPromise = this.loadModules(microModule.submodules);

    const depsPromise = Promise.all([dependencies, submodulesPromise]);

    // All dependencies and submodules have been loaded: load the microModule itself
    const modulePromise = async () => {
      await depsPromise;
      await microModule.onLoad(this.container);
    };

    this.loadingModules[id as any] = modulePromise();

    await this.loadingModules[id as any];

    if (id) {
      this.logger.info(`Module ${id.toString()} successfully loaded`);
    }
  }

  /** Private functions */

  /**
   * Loads all the dependencies for the given module, using the registered ModuleProvider to fetch the dependencies
   * @param microModule
   */
  private async loadDependencies(microModule: MicroModule): Promise<Array<MicroModule>> {
    const promises = microModule.dependencies.map(async (dep) => {
      const module = await this.moduleProvider(this.container)(dep);

      await this.loadModule(module);
      return module;
    });

    return Promise.all(promises);
  }

  private idFromInstance(microModule: MicroModule): interfaces.ServiceIdentifier<any> | undefined {
    return ((microModule.constructor as unknown) as {
      id: interfaces.ServiceIdentifier<any> | undefined;
    }).id;
  }
}
