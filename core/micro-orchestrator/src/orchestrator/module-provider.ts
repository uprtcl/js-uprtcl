import { interfaces } from 'inversify';
import { MicroModule } from './micro.module';

export type ModuleProvider = (
  container: interfaces.Container
) => (moduleId: interfaces.ServiceIdentifier<any>) => Promise<MicroModule>;

/**
 * Function that fetches the module given their id, not loading them
 * This can be replaced to fetch the modules from another source
 */
export const localModuleProvider: ModuleProvider = (container: interfaces.Container) => async (
  moduleId: interfaces.ServiceIdentifier<any>
): Promise<MicroModule> => container.get(moduleId);
