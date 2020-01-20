import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';

import { DiscoveryService } from './services/discovery.service';
import { MultiplatformBindings } from './bindings';

export class DiscoveryModule extends MicroModule {
  static id = Symbol('discovery-module');

  static bindings = MultiplatformBindings;

  dependencies = [CortexModule.id];

  async onLoad(container: interfaces.Container): Promise<void> {
    container
      .bind<DiscoveryService>(DiscoveryModule.bindings.DiscoveryService)
      .to(DiscoveryService);
  }
}
