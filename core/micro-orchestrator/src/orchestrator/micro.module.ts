import { interfaces } from 'inversify';

import { Dictionary } from '../types';

export abstract class MicroModule {
  /**
   * Identifier of the module, to be able to be referenced by other modules as dependencies
   * Set the module's id only in the case that your module should act as a singleton module
   */
  static id: interfaces.ServiceIdentifier<any> | undefined = undefined;

  /**
   * Specify dependencies to other modules by declaring their id in this array
   * This module will only begin to load when all their dependencies are present and loaded
   */
  dependencies: interfaces.ServiceIdentifier<any>[] = [];

  /**
   * Submodules of this module, which will be loaded before this module
   * Use this to compose different modules into one big module
   */
  get submodules(): MicroModule[] {
    return [];
  }

  /**
   * Bindings that this module will make available for other modules to use
   * This bindings **must** be made available through `container.bind()` in the `onLoad()` callback
   */
  static bindings: Dictionary<interfaces.ServiceIdentifier<any>> = {};

  /**
   * Loading callback for the module to load
   * This is the only required function to be defined in any `MicroModule`
   *
   * When this method is called, you can assume:
   *  - All dependencies will be available and loaded (you can get other module's types with `container.get()`)
   *  - All submodules will be loaded
   * After this method is called, other modules will assume:
   *  - All types declared by this module are available in the container (bind them using `container.bind()`)
   * @param container the global container of the application
   */
  abstract async onLoad(container: interfaces.Container): Promise<void>;

  /**
   * Unload callback for the module: use this to free resources
   */
  async onUnload(): Promise<void> {}
}
