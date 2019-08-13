import { Dictionary } from 'lodash';
import { MicroModule } from '../modules/micro.module';

export class MicroOrchestrator {
  modules: Dictionary<MicroModule> = {};

  loaded: Dictionary<boolean> = {};

  static get(): MicroOrchestrator {
    let orchestrator: MicroOrchestrator = window['microorchestrator'];
    if (!orchestrator) {
      orchestrator = new MicroOrchestrator();
      window['microorchestrator'] = orchestrator;
    }

    return orchestrator;
  }

  /**
   * Adds the given modules to the available module list
   * ATTENTION: this will not load the given modules, but only store them to be loaded later
   * @param modules
   */
  addModules(modules: MicroModule[]): void {
    modules.forEach(module => {
      this.modules[module.getId()] = module;
    });
  }

  /**
   * Loads the module with the given id if it wasn't loaded yet, loading its dependencies first
   * @param moduleId the module to load
   */
  async loadModule<T extends MicroModule>(moduleId: string): Promise<T> {
    let module: MicroModule = this.modules[moduleId];

    if (!module) {
      throw new Error(
        `Unknown module ${moduleId}, call addModules with this module and then loadModule`
      );
    }

    if (!this.loaded[moduleId]) {
      // The module has not been loaded yet, first load all its dependencies and then load the module
      const dependenciesIds = module.getDependencies();

      const promises = dependenciesIds.map(dependencyId => this.loadModule(dependencyId));
      const dependencies = await Promise.all(promises);

      const depsDict: Dictionary<MicroModule> = dependencies.reduce(
        (dict, dep) => ({ ...dict, [dep.getId()]: dep }),
        {}
      );

      await module.onLoad(depsDict);

      this.loaded[moduleId] = true;
    }

    return module as T;
  }
}
