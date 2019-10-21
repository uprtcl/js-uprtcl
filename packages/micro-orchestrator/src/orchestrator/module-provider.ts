import { interfaces, AsyncContainerModule } from 'inversify';
import { MicroModule } from '../modules/micro.module';
import { Logger } from '../utils/logger';

export type ModuleProvider = (moduleId: symbol) => Promise<MicroModule>;

export const moduleProvider = (logger: Logger) => {
  const loadedModules = {};
  return (context: interfaces.Context): ModuleProvider => (
    moduleId: symbol
  ): Promise<MicroModule> =>
    new Promise(async resolve => {
      const microModule: MicroModule = context.container.get(moduleId);

      if (loadedModules[moduleId]) {
        resolve(microModule);
        return;
      }

      logger.info(`Attempting to load module `, moduleId);

      const containerModule = new AsyncContainerModule((...args) =>
        microModule.onLoad(context, ...args)
      );

      try {
        await context.container.loadAsync(containerModule);

        logger.info(`Module successfully initialized`, moduleId);

        loadedModules[moduleId] = microModule;
      } catch (e) {
        logger.error(`Module `, moduleId, ' failed to load with error ', e, ', retrying');
      }

      resolve(microModule);
    });
};
