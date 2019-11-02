import multihashing from 'multihashing-async';
import * as Cid from 'cids';

import { Logger } from '@uprtcl/micro-orchestrator';
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
import { ProposalMock } from '../../proposal.mock';
import { sortObject } from '../../../../utils/utils';
import { Secured } from '../../../../patterns/default-secured.pattern';

/** Function signatures */
const ADD_PERSP = 'addPerspective(bytes32,bytes32,string,address,string)';
const UPDATE_HEADS = 'updateHeads((bytes32,string,uint8)[])';
const GET_PERSP = 'getPerspective(bytes32)';
const UPDATE_OWNER = 'changeOwner(bytes32,address)';

const INIT_REQUEST =
  'initRequest(bytes32,bytes32,address,uint32,(bytes32,string,uint8)[],address[],string,string)';
const GET_REQUEST = 'getRequest(bytes32)';
const EXECUTE_REQUEST = 'executeRequest(bytes32)';
const AUTHORIZE_REQUEST = 'setRequestAuthorized(bytes32,uint8)';
const GET_REQUEST_ID = 'getRequestId(bytes32,bytes32,uint32)';

/** hashes the cid to fit in a bytes32 word */
export const hashCid = async (perspectiveCidStr: string) => {
  const cid = new Cid(perspectiveCidStr);
  const encoded = await multihashing.digest(cid.buffer, 'sha2-256');
  return '0x' + encoded.toString('hex');
};

export const hashText = async (text: string) => {
  const encoded = await multihashing.digest(Buffer.from(text), 'sha2-256');
  return '0x' + encoded.toString('hex');
};

export class UprtclEthereum extends IpfsSource implements UprtclRemote {
  logger: Logger = new Logger('UPRTCL-ETH');

  ethConnection!: EthereumConnection;

  constructor(provider: provider, ipfsOptions: IpfsConnectionOptions, options: ConnectionOptions) {
    super(ipfsOptions, options);
    this.ethConnection = new EthereumConnection(
      { provider: provider, contractAbi: UprtclContractArtifact as any },
      options
    );
  }

  get accessControl() {
    return new AccessControlMock();
  }

  get proposals() {
    return new ProposalMock();
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
  async clonePerspective(secured: Secured<Perspective>): Promise<void> {
    let perspective = secured.object.payload;

    /** validate */
    if (!perspective.origin) throw new Error('origin cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.addObject(sortObject(secured.object));
    this.logger.log(`[ETH] createPerspective - added to IPFS`, perspectiveId);

    if (secured.id && secured.id != perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    const perspectiveIdHash = await hashCid(perspectiveId);

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.ethConnection.send(ADD_PERSP, [
      perspectiveIdHash,
      perspectiveIdHash,
      '',
      this.ethConnection.getDefaultAccount(),
      perspectiveId
    ]);

    this.logger.log(`[ETH] addPerspective - TX minted`);
  }

  /**
   * @override
   */
  async cloneCommit(secured: Secured<Commit>): Promise<void> {
    const commit = sortObject(secured.object);
    /** Store the perspective data in the data layer */

    let commitId = await this.addObject(commit);
    this.logger.log(`[ETH] createCommit - added to IPFS`, commitId, commit);

    if (secured.id && secured.id != commitId) {
      throw new Error('commit ID computed by IPFS is not the same as the input one.');
    }
  }

  /**
   * @override
   */
  async updatePerspectiveHead(perspectiveId: string, headId: string): Promise<void> {
    let perspectiveIdHash = await hashCid(perspectiveId);

    await this.ethConnection.send(UPDATE_HEADS, [
      [{ perspectiveIdHash: perspectiveIdHash, headId: headId, executed: 0 }]
    ]);
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
  async getPerspectiveHead(perspectiveId: string): Promise<string | undefined> {
    let perspectiveIdHash = await hashCid(perspectiveId);

    const perspective = await this.ethConnection.call(GET_PERSP, [perspectiveIdHash]);

    /** empty string is null */
    return perspective.headId !== '' ? perspective.headId : null;
  }

  /**
   * @override
   */
  getPerspectiveContext(perspectiveId: string): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
