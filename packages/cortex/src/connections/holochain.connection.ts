import { SocketConnection } from './socket.connection';
import { connect } from '@holochain/hc-web-client';
import { ConnectionOptions } from './connection';

export interface ZomeOptions {
  host: string;
  instanceId: string;
  zome: string;
}

// Auxiliar type for Holochain's get_entry call
export type EntryResult<T = any> = {
  entry: T;
  type: string;
};

export class HolochainConnection extends SocketConnection {
  connection!: (funcName: string, params: any) => Promise<any>;
  onsignal!: (callback: (params: any) => void) => void;

  constructor(protected zomeOptions: ZomeOptions, options: ConnectionOptions = {}) {
    super(options);
  }

  async createSocket(): Promise<WebSocket> {
    const { callZome, ws, onSignal } = await connect({ url: this.zomeOptions.host });

    this.connection = async (funcName: string, params: any) =>
      callZome(this.zomeOptions.instanceId, this.zomeOptions.zome, funcName)(params);
    this.onsignal = onSignal;

    return ws;
  }

  public async call(funcName: string, params: any): Promise<any> {
    await this.ready();
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

  public parseEntry<T extends object>(entry: { Ok: any } | any): T {
    let parseable = entry.Ok ? entry.Ok : entry;
    return JSON.parse(parseable.App[1]);
  }

  public parseEntryResult<T extends object>(entry: any): EntryResult<T> | undefined {
    if (!entry.result.Single.meta) return undefined;
    return {
      entry: {
        id: entry.result.Single.meta.address,
        ...this.parseEntry<T>(entry.result.Single.entry)
      },
      type: entry.result.Single.meta.entry_type.App
    };
  }

  public parseEntries<T extends object>(entryArray: Array<any>): Array<T> {
    return entryArray.map(entry => this.parseEntry(entry));
  }

  public parseEntriesResults<T extends object>(entryArray: Array<any>): Array<EntryResult<T>> {
    return entryArray
      .map(entry => this.parseEntryResult<T>(entry.Ok ? entry.Ok : entry))
      .filter(entry => entry !== undefined) as Array<EntryResult<T>>;
  }
}
