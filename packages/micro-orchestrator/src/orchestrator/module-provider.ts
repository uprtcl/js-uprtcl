import { interfaces, AsyncContainerModule } from 'inversify';
import { MicroModule } from '../modules/micro.module';
import { Logger } from '../utils/logger';

export type ModuleProvider = (moduleId: symbol) => Promise<MicroModule>;

export const moduleProvider = (logger: Logger) => {
  const loadingModules = {};

  return (context: interfaces.Context): ModuleProvider => async (
    moduleId: symbol
  ): Promise<MicroModule> => {
    if (loadingModules[moduleId]) {
      return loadingModules[moduleId];
    }

    logger.info(`Attempting to load module `, moduleId);

    const microModule: MicroModule = context.container.get(moduleId);

    function loadModule(module: MicroModule): Promise<void> {
      const containerModule = new AsyncContainerModule((...args) =>
        module.onLoad(context, ...args)
      );
      return context.container.loadAsync(containerModule);
    }

    if (microModule.submodules) {
      const submodulesPromises = microModule.submodules.map(submoduleConstructor => {
        const submodule = context.container.resolve(submoduleConstructor);
        return loadModule(submodule);
      });
      await Promise.all(submodulesPromises);
    }

    try {
      loadingModules[moduleId] = loadModule(microModule);

      logger.info(`Module successfully initialized`, moduleId);
      return loadingModules[moduleId];
    } catch (e) {
      throw new Error(`Module ${moduleId.toString()} failed to load with error ${e}`);
    }
  };
};
