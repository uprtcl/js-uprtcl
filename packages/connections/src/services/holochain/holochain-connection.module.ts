import { interfaces } from 'inversify';

import { MicroModule } from '@uprtcl/micro-orchestrator';

import { HolochainConnection } from './holochain.connection';
import { HolochainConnectionTypes } from './types';

export class HolochainConnectionModule extends MicroModule {
  static id = Symbol('holochain-connection-module');

  static types = HolochainConnectionTypes;

  constructor(protected connection: HolochainConnection) {
    super();
  }

  async onLoad(container: interfaces.Container) {
    container
      .bind(HolochainConnectionModule.types.HolochainConnection)
      .toConstantValue(this.connection);
  }
}
