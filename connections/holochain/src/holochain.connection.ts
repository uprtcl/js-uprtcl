import { connect } from '@holochain/hc-web-client';
import path from 'path';

import { SocketConnection, ConnectionOptions } from '@uprtcl/multiplatform';
import { parseResponse, parseZomeResponse } from './utils';
import { Dictionary } from '@uprtcl/micro-orchestrator';

export interface HolochainCallOptions {
  instance: string;
  zome: string;
  funcName: string;
  params: any;
}

export interface HolochainConnectionOptions {
  host: string;
  devEnv?: {
    templateDnasPaths: Dictionary<string>;
  };
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
    this.onsignal((params) => {
      this.signalListeners.forEach((l) => l(params));
    });

    return ws;
  }

  async getAgentConfig(agentAddress: string): Promise<{ id: string; public_address: string }> {
    const agentList = await this.callAdmin('admin/agent/list', {});
    const agentName = agentList.find((a) => a.public_address === agentAddress);
    return agentName;
  }

  async cloneDna(
    agentId: string,
    newDnaId: string,
    newInstanceId: string,
    templateDnaAddress: string,
    properties: any,
    findInterface: (interfaces: Array<any>) => any
  ): Promise<void> {
    const holoscapeDataDir = this.getHoloscapeDataDir();
    let path: string | undefined = undefined;
    if (holoscapeDataDir) {
      path = `${holoscapeDataDir}/dna/${templateDnaAddress}.dna.json`;
    } else {
      if (!this.hcConnectionOptions.devEnv)
        throw new Error(
          'Trying to clone a DNA in development environment but without the devEnv property of HolochainConnection set'
        );
      path = this.hcConnectionOptions.devEnv.templateDnasPaths[templateDnaAddress];
    }

    const dnaResult = await this.callAdmin('admin/dna/install_from_file', {
      id: newDnaId,
      path,
      properties,
      copy: true,
    });

    const instanceResult = await this.callAdmin('admin/instance/add', {
      id: newInstanceId,
      agent_id: agentId,
      dna_id: newDnaId,
    });

    const interfaceList = await this.callAdmin('admin/interface/list', {});
    // TODO: review this: what interface to pick?
    const iface = findInterface(interfaceList);

    const ifaceResult = this.callAdmin('admin/interface/add_instance', {
      instance_id: newInstanceId,
      interface_id: iface.id,
    });

    await new Promise((resolve) => setTimeout(() => resolve(), 300));
    const startResult = await this.callAdmin('admin/instance/start', { id: newInstanceId });
  }

  /**
   * Returns whether this connection is attached to an admin permissioned interface
   */
  async isAdminInterface(): Promise<boolean> {
    try {
      await this.callAdmin('admin/dna/list', {});
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Will return undefined if we are not on holoscape
   */
  getHoloscapeDataDir(): string | undefined {
    try {
      const { app } = window.require('electron').remote;

      const holoscapeOrStandalone = 'Holoscape-default';

      const rootConfigPath = path.join(app.getPath('appData'), holoscapeOrStandalone);
      return rootConfigPath;
    } catch (e) {
      return undefined;
    }
  }

  public async callAdmin(funcName: string, params: any): Promise<any> {
    this.logger.log('CALL ADMIN INTERFACE:', funcName, params);

    const jsonString = await this.genericCall(funcName)(params);
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
    const listener = (params) => {
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
