import { Dictionary } from 'lodash';
import { MicroModule } from '../modules/micro.module';

export class MicroOrchestrator {
  modules: Dictionary<MicroModule> = {};

  static get(): MicroOrchestrator {
    let orchestrator: MicroOrchestrator = window['microorchestrator'];
    if (!orchestrator) {
      orchestrator = new MicroOrchestrator();
      window['microorchestrator'] = orchestrator;
    }

    return orchestrator;
  }

  /**
   * Loads the given modules to the available module list
   * @param modules
   */
  async loadModules(...modules: MicroModule[]): Promise<void> {
    for (const microModule of modules) {
      await this.loadModule(microModule);
    }
  }

  /**
   * Loads the module with the given id if it wasn't loaded yet, loading its dependencies first
   * @param moduleId the module to load
   */
  async loadModule<T extends MicroModule>(microModule: MicroModule): Promise<T> {
    if (!microModule) {
      throw new Error(`Given module is undefined`);
    }

    const moduleId = microModule.getId();

    if (!this.modules[moduleId]) {
      // The module has not been loaded yet, first load all its dependencies and then load the module
      const dependenciesIds = microModule.getDependencies();

      for (const depId of dependenciesIds) {
        if (!this.modules[depId]) {
          throw new Error(`Attempting to load ${moduleId}: dependency ${depId} of given module has not yet been loaded`);
        }
      }

      const depsDict: Dictionary<MicroModule> = dependenciesIds.reduce(
        (dict, depId) => ({ ...dict, [depId]: this.modules[depId] }),
        {}
      );

      await microModule.onLoad(depsDict);

      this.modules[moduleId] = microModule;
    }

    return microModule as T;
  }
}
