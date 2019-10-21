import { connect } from '@holochain/hc-web-client';
import { Hashed } from '@uprtcl/cortex';

import { SocketConnection } from '../../connections/socket.connection';
import { ConnectionOptions } from '../../connections/connection';

export interface HolochainConnectionOptions {
  host: string;
  instance: string;
}

// Auxiliar type for Holochain's get_entry call
export type EntryResult<T extends object = any> = {
  entry: Hashed<T>;
  type: string;
};

export class HolochainConnection extends SocketConnection {
  connection!: (funcName: string, params: any) => Promise<any>;
  onsignal!: (callback: (params: any) => void) => void;

  constructor(
    protected zome: string,
    protected hcOptions: HolochainConnectionOptions,
    options: ConnectionOptions = {}
  ) {
    super(options);
  }

  async createSocket(): Promise<WebSocket> {
    const { callZome, ws, onSignal } = await connect({ url: this.hcOptions.host });

    this.connection = async (funcName: string, params: any) =>
      callZome(this.hcOptions.instance, this.zome, funcName)(params);
    this.onsignal = onSignal;

    return ws;
  }

  public async call(funcName: string, params: any): Promise<any> {
    this.logger.log('CALL ZOME:', funcName, params);
    const jsonString = await this.connection(funcName, params);

    const result = JSON.parse(jsonString);

    if (result.Err) throw new Error(JSON.stringify(result.Err));
    if (result.SerializationError) {
      throw new Error(JSON.stringify(result.SerializationError));
    }

    this.logger.log('ZOME RESULT:', funcName, params, result);
    if (result.Ok) return result.Ok;
    return result;
  }

  public async onSignal(callback: (params: any) => void): Promise<void> {
    await this.ready();
    return this.onSignal(callback);
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
      .map(entry => this.parseEntryResult<T>(this.parseResponse(entryArray)))
      .filter(entry => entry != undefined) as Array<EntryResult<T>>;
  }
}
