import { injectable, inject } from 'inversify';

import { Entity } from '@uprtcl/cortex';
import { Authority } from '@uprtcl/access-control';
import { Constructor } from '@uprtcl/micro-orchestrator';

import { HolochainConnection } from './holochain.connection';
import { HolochainConnectionBindings } from './bindings';

@injectable()
export abstract class HolochainProvider implements Authority {
  authority!: string;

  abstract instance: string;
  abstract zome: string;

  constructor(
    @inject(HolochainConnectionBindings.HolochainConnection)
    protected connection: HolochainConnection
  ) {}

  userId?: string | undefined;

  /**
   * @override
   */
  public async ready() {
    await this.connection.ready();
  }

  public async call(funcName: string, params: any): Promise<any> {
    return this.connection.call(this.instance, this.zome, funcName, params);
  }

  async isLogged(): Promise<boolean> {
    return true;
  }
  async login(): Promise<void> {}
  async logout(): Promise<void> {}
}

export function createHolochainProvider(
  instance: string,
  zome: string
): Constructor<HolochainProvider> {
  @injectable()
  class ConcreteProvider extends HolochainProvider {
    instance: string = instance;
    zome: string = zome;
  }

  return ConcreteProvider;
}
