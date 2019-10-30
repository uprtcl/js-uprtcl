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

    const containerModule = new AsyncContainerModule((...args) =>
      microModule.onLoad(context, ...args)
    );

    try {
      loadingModules[moduleId] = context.container.loadAsync(containerModule);

      logger.info(`Module successfully initialized`, moduleId);
      return loadingModules[moduleId];
    } catch (e) {
      throw new Error(`Module ${moduleId.toString()} failed to load with error ${e}`);
    }
  };
};
