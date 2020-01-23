import { connect } from '@holochain/hc-web-client';

import { SocketConnection, ConnectionOptions } from '@uprtcl/multiplatform';

export interface HolochainCallOptions {
  instance: string;
  zome: string;
  funcName: string;
  params: any;
}

export interface HolochainConnectionOptions {
  host: string;
}

export class HolochainConnection extends SocketConnection {
  connection!: (instance: string, zome: string, funcName: string, params: any) => Promise<any>;
  onsignal!: (callback: (params: any) => void) => void;

  constructor(
    protected hcConnectionOptions: HolochainConnectionOptions,
    options: ConnectionOptions = {}
  ) {
    super(options);
  }

  async createSocket(): Promise<WebSocket> {
    const { callZome, ws, onSignal } = await connect({ url: this.hcConnectionOptions.host });

    this.connection = async (instance: string, zome: string, funcName: string, params: any) =>
      callZome(instance, zome, funcName)(params);
    this.onsignal = onSignal;

    return ws;
  }

  public async call(instance: string, zome: string, funcName: string, params: any): Promise<any> {
    this.logger.log('CALL ZOME:', funcName, params);
    const jsonString = await this.connection(instance, zome, funcName, params);

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
}
