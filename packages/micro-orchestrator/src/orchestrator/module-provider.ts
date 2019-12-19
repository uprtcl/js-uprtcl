import { interfaces, AsyncContainerModule } from 'inversify';
import { MicroModule } from '../modules/micro.module';
import { Logger } from '../utils/logger';

export type ModuleProvider = (moduleId: string | symbol) => Promise<MicroModule>;

/**
 * Function that deals with loading the modules, making sure that there is no duplication
 * @param logger
 */
export const moduleProvider = (logger: Logger) => {
  const loadingModules = {};

  return (context: interfaces.Context): ModuleProvider => async (
    moduleId: string | symbol
  ): Promise<MicroModule> => {
    if (loadingModules[moduleId]) {
      return loadingModules[moduleId];
    }

    logger.info(`Attempting to load module `, moduleId);

    const microModule: MicroModule = context.container.get(moduleId);

    try {
      loadingModules[moduleId] = loadModule(context, microModule);

      logger.info(`Module successfully initialized`, moduleId);
      return loadingModules[moduleId];
    } catch (e) {
      throw new Error(`Module ${moduleId.toString()} failed to load with error ${e}`);
    }
  };
};

/**
 * Loads the given module with all its dependencies
 * @param context
 * @param module
 */
async function loadModule(context: interfaces.Context, microModule: MicroModule): Promise<void> {
  if (microModule.submodules) {
    const submodulesPromises = microModule.submodules.map(submoduleConstructor => {
      const submodule = context.container.resolve(submoduleConstructor);
      return loadModule(context, submodule);
    });
    await Promise.all(submodulesPromises);
  }

  if (microModule.onLoad) {
    const containerModule = new AsyncContainerModule((...args) =>
      (microModule as {
        onLoad: (
          context: interfaces.Context,
          bind: interfaces.Bind,
          unbind: interfaces.Unbind,
          isBound: interfaces.IsBound,
          rebind: interfaces.Rebind
        ) => Promise<void>;
      }).onLoad(context, ...args)
    );
    await context.container.loadAsync(containerModule);
  }
}
