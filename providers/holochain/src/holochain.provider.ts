import { injectable, inject } from 'inversify';

import { Hashed } from '@uprtcl/cortex';
import { Authority } from '@uprtcl/multiplatform';
import { Constructor } from '@uprtcl/micro-orchestrator';

import { HolochainConnection } from './holochain.connection';
import { HolochainConnectionBindings } from './bindings';

// Auxiliar type for Holochain's get_entry call
export type EntryResult<T extends object = any> = {
  entry: Hashed<T>;
  type: string;
};

@injectable()
export abstract class HolochainProvider implements Authority {
  authority!: string;

  abstract instance: string;
  abstract zome: string;

  constructor(
    @inject(HolochainConnectionBindings.HolochainConnection)
    protected connection: HolochainConnection
  ) {}

  /**
   * @override
   */
  public async ready() {
    await this.connection.ready();
  }

  public async call(funcName: string, params: any): Promise<any> {
    return this.connection.call(this.instance, this.zome, funcName, params);
  }

  public parseResponse(response: { Ok: any } | any): any {
    return response.hasOwnProperty('Ok') ? response.Ok : response;
  }

  public parseEntry<T extends object>(entry: { Ok: any } | any): T {
    return JSON.parse(this.parseResponse(entry).App[1]);
  }

  public parseEntryResult<T extends object>(entry: any): EntryResult<T> | undefined {
    entry = this.parseResponse(entry);
    if (!entry.result.Single.meta) return undefined;
    return {
      entry: {
        id: entry.result.Single.meta.address,
        object: this.parseEntry<T>(entry.result.Single.entry)
      },
      type: entry.result.Single.meta.entry_type.App
    };
  }

  public parseEntries<T extends object>(entryArray: Array<any>): Array<T> {
    return entryArray.map(entry => this.parseEntry(entry));
  }

  public parseEntriesResults<T extends object>(entryArray: Array<any>): Array<EntryResult<T>> {
    return entryArray
      .map(entry => this.parseEntryResult<T>(this.parseResponse(entry)))
      .filter(entry => entry != undefined) as Array<EntryResult<T>>;
  }
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
