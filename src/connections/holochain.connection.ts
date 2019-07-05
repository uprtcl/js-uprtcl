import { SocketConnection } from './socket.connection';
import { connect } from '@holochain/hc-web-client';
import WebSocket from 'ws';

// Auxiliar type for Holochain's get_entry call
export type EntryResult<T = any> = {
  entry: T
  type: string
} | null;

export class HolochainConnection extends SocketConnection {
  connection!: (funcName: string, params: any) => Promise<any>;
  onsignal!: (callback: (params: any) => void) => void;

  constructor(private host: string, private instanceId: string, private zome: string) {
    super();
  }

  async createSocket(): Promise<WebSocket> {
    const { callZome, ws, onSignal } = await connect({ url: this.host });

    this.connection = async (funcName: string, params: any) =>
      callZome(this.instanceId, this.zome, funcName)(params);
    this.onsignal = onSignal;

    return ws;
  }

  public async call(funcName: string, params: any): Promise<any> {
    await this.ready();
    console.log('[CALL ZOME FUNCTION]:', funcName, params);
    const jsonString = await this.connection(funcName, params);

    const result = JSON.parse(jsonString);

    if (result.Err) throw new Error(JSON.stringify(result.Err));
    if (result.SerializationError) {
      throw new Error(JSON.stringify(result.SerializationError));
    }

    console.log('[RESULT]:', funcName, params, result);
    if (result.Ok) return result.Ok;
    return result;
  }

  public async onSignal(callback: (params: any) => void): Promise<void> {
    await this.ready();
    return this.onSignal(callback);
  }

  public parseEntry<T>(entry: { Ok: any } | any): T {
    let parseable = entry.Ok ? entry.Ok : entry;
    return JSON.parse(parseable.App[1]);
  }

  public parseEntryResult<T>(entry: any): EntryResult<T> {
    if (!entry.result.Single.meta) return null;
    return {
      entry: {
        id: entry.result.Single.meta.address,
        ...this.parseEntry<T>(entry.result.Single.entry)
      },
      type: entry.result.Single.meta.entry_type.App
    };
  }

  public parseEntries<T>(entryArray: Array<any>): Array<T> {
    return entryArray.map(entry => this.parseEntry(entry));
  }

  public parseEntriesResults<T>(entryArray: Array<any>): Array<EntryResult<T>> {
    return entryArray
      .map(entry => this.parseEntryResult<T>(entry.Ok ? entry.Ok : entry))
      .filter(entry => !!entry);
  }
}
