import { Container } from 'inversify';

import { Logger } from '@uprtcl/micro-orchestrator';
import {
  EthereumConnection,
  EthereumContractOptions,
  EthereumContract,
} from '@uprtcl/ethereum-provider';
import { IpfsStore, sortObject, IpfsConnectionOptions } from '@uprtcl/ipfs-provider';
import { CidConfig } from '@uprtcl/multiplatform';
import { Authority } from '@uprtcl/access-control';

import { abi as abiRoot, networks as networksRoot } from './contracts-json/UprtclRoot.min.json';
import {
  abi as abiDetails,
  networks as networksDetails,
} from './contracts-json/UprtclDetails.min.json';
import {
  abi as abiProposals,
  networks as networksProposals,
} from './contracts-json/UprtclProposals.min.json';
import {
  abi as abiWrapper,
  networks as networksWrapper,
} from './contracts-json/UprtclWrapper.min.json';

const UprtclRoot = { abi: abiRoot, networks: networksRoot };
const UprtclDetails = { abi: abiDetails, networks: networksDetails };
const UprtclProposals = { abi: abiProposals, networks: networksProposals };
const UprtclWrapper = { abi: abiWrapper, networks: networksWrapper };

import { Secured } from '../../../utils/cid-hash';
import { Commit, Perspective, PerspectiveDetails, NewPerspectiveData } from '../../../types';
import { EveesRemote } from '../../evees.remote';
import {
  CREATE_PERSP,
  UPDATE_PERSP_DETAILS,
  GET_PERSP_DETAILS,
  INIT_PERSP,
  GET_CONTEXT_HASH,
  cidToHex32,
  bytes32ToCid,
  GET_PERSP_HASH,
  INIT_PERSP_BATCH,
  UPDATE_OWNER,
  UPDATED_HEAD,
  getEthPerspectiveHead,
  getEthPerspectiveContext,
} from './common';
import { EveesAccessControlEthereum } from './evees-access-control.ethereum';
import { ProposalsEthereum } from './proposals.ethereum';
import { ProposalsProvider } from '../../proposals.provider';

const evees_if = 'evees-v0';
export const ZERO_HEX_32 = '0x' + new Array(32).fill(0).join('');
export const ZERO_ADDRESS = '0x' + new Array(40).fill(0).join('');

export const hashToId = async (uprtclRoot: EthereumContract, perspectiveIdHash: string) => {
  /** check the creation event to reverse map the cid */
  const perspectiveAddedEvents = await uprtclRoot.contractInstance.getPastEvents(
    'PerspectiveCreated',
    {
      filter: { perspectiveIdHash: perspectiveIdHash },
      fromBlock: 0,
    }
  );

  /** one event should exist only */
  const perspectiveAddedEvent = perspectiveAddedEvents[0];

  if (!perspectiveAddedEvent) {
    throw new Error(`Perspective with hash ${perspectiveIdHash} not found`);
  }

  return perspectiveAddedEvent.returnValues.perspectiveId;
};

export class EveesEthereum extends IpfsStore implements EveesRemote, Authority {
  logger: Logger = new Logger('EveesEtereum');

  accessControl: EveesAccessControlEthereum;
  proposals: ProposalsProvider;

  protected uprtclRoot: EthereumContract;
  protected uprtclDetails: EthereumContract;
  protected uprtclProposals: EthereumContract;
  protected uprtclWrapper: EthereumContract;

  constructor(
    protected ethConnection: EthereumConnection,
    protected ipfsOptions: IpfsConnectionOptions,
    cidConfig: CidConfig,
    container: Container,
    uprtclRootOptions: EthereumContractOptions = { contract: UprtclRoot as any },
    uprtclDetailsOptions: EthereumContractOptions = { contract: UprtclDetails as any },
    uprtclProposalsOptions: EthereumContractOptions = { contract: UprtclProposals as any },
    uprtclWrapperOptions: EthereumContractOptions = { contract: UprtclWrapper as any }
  ) {
    super(ipfsOptions, cidConfig);

    this.uprtclRoot = new EthereumContract(uprtclRootOptions, ethConnection);
    this.uprtclDetails = new EthereumContract(uprtclDetailsOptions, ethConnection);
    this.uprtclProposals = new EthereumContract(uprtclProposalsOptions, ethConnection);
    this.uprtclWrapper = new EthereumContract(uprtclWrapperOptions, ethConnection);

    this.accessControl = new EveesAccessControlEthereum(this.uprtclRoot, container);
    this.proposals = new ProposalsEthereum(
      this.uprtclRoot,
      this.uprtclProposals,
      this.uprtclWrapper,
      this.accessControl,
      this
    );
  }

  get authority() {
    return `eth-${this.ethConnection.networkId}:${evees_if}:${
      this.uprtclRoot.contractInstance.options.address
        ? this.uprtclRoot.contractInstance.options.address.toLocaleLowerCase()
        : ''
    }`;
  }

  get userId() {
    return this.ethConnection.getCurrentAccount();
  }

  /**
   * @override
   */
  async ready(): Promise<void> {
    await Promise.all([
      this.uprtclRoot.ready(),
      this.uprtclDetails.ready(),
      this.uprtclProposals.ready(),
      this.uprtclWrapper.ready(),
      super.ready(),
    ]);
  }

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspectiveId = await this.create(secured.object);
    this.logger.log(`[ETH] persistPerspectiveEntity - added to IPFS`, perspectiveId);

    if (secured.id && secured.id != perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    return perspectiveId;
  }

  async cloneAndInitPerspective(perspectiveData: NewPerspectiveData): Promise<void> {
    const secured = perspectiveData.perspective;
    const details = perspectiveData.details;
    const canWrite = perspectiveData.canWrite;

    /** validate */
    if (!secured.object.payload.authority) throw new Error('authority cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.persistPerspectiveEntity(secured);

    const headCidParts = details.headId ? cidToHex32(details.headId) : [ZERO_HEX_32, ZERO_HEX_32];

    const newPerspective = {
      perspectiveId: perspectiveId,
      headCid1: headCidParts[0],
      headCid0: headCidParts[1],
      owner: canWrite ? canWrite : this.ethConnection.getCurrentAccount(),
    };

    const context = details.context ? details.context : '';

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.uprtclDetails.send(INIT_PERSP, [
      { perspective: newPerspective, context: context },
      this.uprtclDetails.userId,
    ]);
  }

  async preparePerspectives(newPerspectivesData: NewPerspectiveData[]) {
    const persistPromises = newPerspectivesData.map((perspectiveData) => {
      return this.persistPerspectiveEntity(perspectiveData.perspective);
    });

    await Promise.all(persistPromises);

    const ethPerspectivesDataPromises = newPerspectivesData.map(
      async (perspectiveData): Promise<any> => {
        const headCidParts = perspectiveData.details.headId
          ? cidToHex32(perspectiveData.details.headId)
          : [ZERO_HEX_32, ZERO_HEX_32];

        const perspective = {
          perspectiveId: perspectiveData.perspective.id,
          headCid1: headCidParts[0],
          headCid0: headCidParts[1],
          owner: perspectiveData.canWrite
            ? perspectiveData.canWrite
            : this.ethConnection.getCurrentAccount(),
        };

        return { perspective, context: perspectiveData.details.context };
      }
    );

    const ethPerspectivesData = await Promise.all(ethPerspectivesDataPromises);

    return ethPerspectivesData;
  }

  async clonePerspectivesBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    const ethPerspectivesData = await this.preparePerspectives(newPerspectivesData);

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.uprtclDetails.send(INIT_PERSP_BATCH, [
      ethPerspectivesData,
      this.ethConnection.getCurrentAccount(),
    ]);
  }

  /**
   * @override
   */
  async clonePerspective(secured: Secured<Perspective>): Promise<void> {
    let perspective = secured.object.payload;

    /** validate */
    if (!perspective.authority) throw new Error('authority cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.create(sortObject(secured.object));
    this.logger.log(`[ETH] createPerspective - added to IPFS`, perspectiveId);

    if (secured.id && secured.id != perspectiveId) {
      throw new Error(
        `perspective ID computed by IPFS ${perspectiveId} is not the same as the input one ${secured.id}.`
      );
    }

    const newPerspective = {
      perspectiveId: perspectiveId,
      headCid1: ZERO_HEX_32,
      headCid0: ZERO_HEX_32,
      owner: this.ethConnection.getCurrentAccount(),
    };

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.uprtclRoot.send(CREATE_PERSP, [
      newPerspective,
      this.ethConnection.getCurrentAccount(),
    ]);

    this.logger.log(`[ETH] addPerspective - TX minted`);
  }

  /**
   * @override
   */
  async cloneCommit(secured: Secured<Commit>): Promise<void> {
    const commit = sortObject(secured.object);
    /** Store the perspective data in the data layer */

    let commitId = await this.create(commit);
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
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [perspectiveId]);

    if (details.context !== undefined) {
      await this.uprtclDetails.send(UPDATE_PERSP_DETAILS, [
        perspectiveIdHash,
        details.context ? details.context : '',
      ]);
    }

    if (details.headId !== undefined) {
      const headCidParts = cidToHex32(details.headId);

      await this.uprtclRoot.send(UPDATED_HEAD, [
        perspectiveIdHash,
        headCidParts[0],
        headCidParts[1],
        ZERO_ADDRESS,
      ]);
    }
  }

  async hashToId(hash: string) {
    return hashToId(this.uprtclRoot, hash);
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<string[]> {
    const contextHash = await this.uprtclDetails.call(GET_CONTEXT_HASH, [context]);

    let perspectiveContextUpdatedEvents = await this.uprtclDetails.contractInstance.getPastEvents(
      'PerspectiveDetailsSet',
      {
        filter: { contextHash: contextHash },
        fromBlock: 0,
      }
    );

    let perspectiveIdHashes = perspectiveContextUpdatedEvents.map(
      (e) => e.returnValues.perspectiveIdHash
    );

    const hashToIdPromises = perspectiveIdHashes.map((idHash) => this.hashToId(idHash));
    this.logger.log(`[ETH] getContextPerspectives of ${context}`, perspectiveIdHashes);

    return Promise.all(hashToIdPromises);
  }

  /**
   * @override
   */
  async getPerspectiveDetails(perspectiveId: string): Promise<PerspectiveDetails> {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [perspectiveId]);

    const context = await getEthPerspectiveContext(
      this.uprtclDetails.contractInstance,
      perspectiveIdHash
    );
    const ethPerspective = await getEthPerspectiveHead(
      this.uprtclRoot.contractInstance,
      perspectiveIdHash
    );

    const headId =
      ethPerspective !== undefined
        ? bytes32ToCid([ethPerspective.headCid1, ethPerspective.headCid0])
        : undefined;

    return { name: '', context, headId };
  }

  async deletePerspective(perspectiveId: string): Promise<void> {
    const perspectiveIdHash = await this.uprtclRoot.call(GET_PERSP_HASH, [perspectiveId]);
    let contextHash = ZERO_HEX_32;

    /** set null values */
    await this.uprtclDetails.send(UPDATE_PERSP_DETAILS, [
      perspectiveIdHash,
      contextHash,
      '',
      '',
      '',
    ]);

    /** set null owner (cannot be undone) */
    const ZERO_ADD = '0x' + new Array(40).fill(0).join('');
    await this.uprtclRoot.send(UPDATE_OWNER, [perspectiveIdHash, ZERO_ADD]);
  }

  isLogged(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  login(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
