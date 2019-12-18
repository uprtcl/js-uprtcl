import { Container, interfaces } from 'inversify';
import { MicroModule } from '../modules/micro.module';
import { ModuleContainer } from '../elements/module-container';
import { Logger } from '../utils/logger';
import { MicroOrchestratorTypes, ModulesToLoad } from '../types';
import { ModuleProvider, moduleProvider } from './module-provider';

export class MicroOrchestrator {
  logger: Logger = new Logger('micro-orchestrator');
  container = new Container({ skipBaseClassChecks: true });

  constructor() {
    customElements.define('module-container', ModuleContainer(this.container));

    this.container
      .bind<Logger>(MicroOrchestratorTypes.Logger)
      .toDynamicValue((ctx: interfaces.Context) => {
        const logger = new Logger(ctx.plan.rootRequest.serviceIdentifier['name']);

        return logger;
      });

    this.container
      .bind<ModuleProvider>(MicroOrchestratorTypes.ModuleProvider)
      .toProvider<MicroModule>(moduleProvider(this.logger));
  }

  /**
   * Loads the given modules
   * @param modules
   */
  async loadModules(modules: ModulesToLoad): Promise<void> {
    const ids = Object.getOwnPropertySymbols(modules);

    for (const id of ids) {
      this.container
        .bind<MicroModule>(id)
        .to(modules[id as any])
        .inSingletonScope();
    }

    const provider: ModuleProvider = this.container.get(MicroOrchestratorTypes.ModuleProvider);
    const promises = ids.map(async moduleId => provider(moduleId));

    await Promise.all(promises);
  }
}
