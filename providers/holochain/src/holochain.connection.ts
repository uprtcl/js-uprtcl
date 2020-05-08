import { connect } from '@holochain/hc-web-client';

import { SocketConnection, ConnectionOptions } from '@uprtcl/multiplatform';
import { parseResponse, parseZomeResponse } from './utils';

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
  private signalListeners: Array<(params: any) => void> = [];
  onsignal!: (callback: (params: any) => void) => void;
  private genericCall!: (...segments: Array<string>) => (params: any) => Promise<any>;

  constructor(
    protected hcConnectionOptions: HolochainConnectionOptions,
    options: ConnectionOptions = {}
  ) {
    super(options);
  }

  async createSocket(): Promise<WebSocket> {
    const { call, callZome, ws, onSignal } = await connect({ url: this.hcConnectionOptions.host });

    this.genericCall = call;

    this.connection = async (instance: string, zome: string, funcName: string, params: any) =>
      callZome(instance, zome, funcName)(params);
    this.onsignal = onSignal;
    this.onsignal(params => {
      this.signalListeners.forEach(l => l(params));
    });

    return ws;
  }

  public async callAdmin(funcName: string, params: any): Promise<any> {
    this.logger.log('CALL ADMIN INTERFACE:', funcName, params);

    const jsonString = this.genericCall(funcName)(params);
    const result = parseZomeResponse(jsonString);

    this.logger.log('ADMIN CALL RESULT:', funcName, params, result);
    return result;
  }

  public async call(instance: string, zome: string, funcName: string, params: any): Promise<any> {
    this.logger.log('CALL ZOME:', funcName, params);
    const jsonString = await this.connection(instance, zome, funcName, params);

    const result = parseZomeResponse(jsonString);

    this.logger.log('ZOME RESULT:', funcName, params, result);
    return result;
  }

  public async onSignal(signalName: string, callback: (params: any) => void): Promise<void> {
    await this.ready();
    const listener = params => {
      if (params.signal && params.signal.name === signalName) {
        let args = params.signal.arguments;
        try {
          args = JSON.parse(args);
        } catch (e) {}
        callback(args);
      }
    };
    this.signalListeners.push(listener);
  }
}
