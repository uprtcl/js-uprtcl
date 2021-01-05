import { interfaces } from 'inversify';

import { MultiSourceService } from './services/multi-source.service';
import { DiscoveryBindings } from './bindings';

export class DiscoveryModule extends MicroModule {
  static id = 'discovery-module';

  static bindings = DiscoveryBindings;

  dependencies = [CortexModule.id];

  constructor() {
    super();
  }

  submodules = [];

  async onLoad(container: interfaces.Container): Promise<void> {
    container
      .bind<MultiSourceService>(DiscoveryModule.bindings.MultiSourceService)
      .to(MultiSourceService);
  }
}
