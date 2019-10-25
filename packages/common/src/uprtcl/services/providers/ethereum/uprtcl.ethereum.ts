import { Secured } from '@uprtcl/cortex';
import {
  IpfsSource,
  EthereumConnection,
  ConnectionOptions,
  IpfsConnectionOptions,
  provider
} from '@uprtcl/connections';

import * as UprtclContractArtifact from './uprtcl-contract.json';

import { Commit, Perspective } from '../../../../types';
import { UprtclRemote } from '../../uprtcl.remote';
import { AccessControlMock } from '../../../../access-control/services/access-control.mock';

export class UprtclEthereum extends IpfsSource implements UprtclRemote {
  ethConnection!: EthereumConnection;

  constructor(provider: provider, ipfsOptions: IpfsConnectionOptions, options: ConnectionOptions) {
    super(ipfsOptions, options);
    this.ethConnection = new EthereumConnection(
      { provider: provider, contractAbi: UprtclContractArtifact, contractAddress: '' },
      options
    );
  }

  get accessControlService() {
    return new AccessControlMock();
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    await Promise.all([super.ready(), this.ethConnection.ready()]);
  }

  /**
   * @override
   */
  async clonePerspective(perspective: Secured<Perspective>): Promise<void> {
    await this.addObject(perspective);
  }

  /**
   * @override
   */
  async cloneCommit(commit: Secured<Commit>): Promise<void> {
    await this.addObject(commit);
  }

  /**
   * @override
   */
  updatePerspectiveHead(perspectiveId: string, headId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * @override
   */
  updatePerspectiveContext(perspectiveId: string, context: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * @override
   */
  getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    throw new Error('Method not implemented.');
  }

  /**
   * @override
   */
  getPerspectiveHead(perspectiveId: string): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }

  /**
   * @override
   */
  getPerspectiveContext(perspectiveId: string): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
