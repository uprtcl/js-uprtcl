import { Logger } from '@uprtcl/micro-orchestrator';
import {
  IpfsSource,
  EthereumConnection,
  EthereumProviderOptions,
  EthereumProvider,
  IpfsConnection
} from '@uprtcl/connections';
import { sortObject, Secured } from '@uprtcl/common';
import { Hashed } from '@uprtcl/cortex';

import * as EveesContractArtifact from './uprtcl-contract.json';

import { Commit, Perspective, PerspectiveDetails } from '../../../types';
import { EveesRemote } from '../../evees.remote';
import { ADD_PERSP, UPDATE_PERSP_DETAILS, GET_PERSP_DETAILS, hashCid } from './common';
import { EveesAccessControlEthereum } from './evees-access-control.ethereum';

export class EveesEthereum extends EthereumProvider implements EveesRemote {
  logger: Logger = new Logger('EveesEtereum');

  ipfsSource: IpfsSource;

  constructor(
    protected ethConnection: EthereumConnection,
    ipfsConnection: IpfsConnection,
    ethOptions: EthereumProviderOptions = { contract: EveesContractArtifact as any }
  ) {
    super(ethOptions, ethConnection);
    this.ipfsSource = new IpfsSource(ipfsConnection);
  }

  get authority() {
    return 'eth:hi:mynameistal';
  }

  get accessControl() {
    return new EveesAccessControlEthereum(this);
  }

  get proposals() {
    return undefined;
    // Cesar: substituir por `return new ProposalsEthereum(this)`
  }

  get source() {
    return this.ipfsSource.source;
  }

  /**
   * @override
   */
  public get<T>(hash: string): Promise<Hashed<T> | undefined> {
    return this.ipfsSource.get(hash);
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    await Promise.all([super.ready(), this.ipfsSource.ready()]);
  }

  /**
   * @override
   */
  async clonePerspective(secured: Secured<Perspective>): Promise<void> {
    let perspective = secured.object.payload;

    /** validate */
    if (!perspective.origin) throw new Error('origin cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.ipfsSource.addObject(sortObject(secured.object));
    this.logger.log(`[ETH] createPerspective - added to IPFS`, perspectiveId);

    if (secured.id && secured.id != perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    const perspectiveIdHash = await hashCid(perspectiveId);

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.send(ADD_PERSP, [
      perspectiveIdHash,
      perspectiveIdHash,
      '',
      '',
      '',
      this.ethConnection.getCurrentAccount(),
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

    let commitId = await this.ipfsSource.addObject(commit);
    this.logger.log(`[ETH] createCommit - added to IPFS`, commitId, commit);

    if (secured.id && secured.id != commitId) {
      throw new Error('commit ID computed by IPFS is not the same as the input one.');
    }
  }

  /**
   * @override
   */
  async updatePerspectiveDetails(
    perspectiveId: string,
    details: PerspectiveDetails
  ): Promise<void> {
    let perspectiveIdHash = await hashCid(perspectiveId);

    await this.send(UPDATE_PERSP_DETAILS, [
      perspectiveIdHash,
      details.headId || '',
      details.context || '',
      details.name || ''
    ]);
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<Secured<Perspective>[]> {
    return [];
  }

  /**
   * @override
   */
  async getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    const perspectiveIdHash = await hashCid(perspectiveId);

    const perspective: PerspectiveDetails & { owner: string } = await this.call(GET_PERSP_DETAILS, [
      perspectiveIdHash
    ]);
    return { name: perspective.name, context: perspective.context, headId: perspective.headId };
  }
}
