import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { HolochainConnection } from './holochain.connection';
import { HolochainConnectionBindings } from './bindings';

export class HolochainConnectionModule extends MicroModule {
  static id = Symbol('holochain-connection-module');

  static bindings = HolochainConnectionBindings;

  constructor(protected connection: HolochainConnection) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container
      .bind(HolochainConnectionModule.bindings.HolochainConnection)
      .toConstantValue(this.connection);
  }
}
