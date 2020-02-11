import { Logger } from '@uprtcl/micro-orchestrator';
import {
  EthereumConnection,
  EthereumProviderOptions,
  EthereumProvider
} from '@uprtcl/ethereum-provider';
import { IpfsSource, IpfsConnection, sortObject, CidConfig } from '@uprtcl/ipfs-provider';
import { Hashed } from '@uprtcl/cortex';
import { KnownSourcesService } from '@uprtcl/multiplatform';

import * as EveesContractArtifact from './uprtcl-contract.json';

import { Secured } from '../../../patterns/default-secured.pattern';
import { Commit, Perspective, PerspectiveDetails } from '../../../types';
import { EveesRemote } from '../../evees.remote';
import {
  ADD_PERSP,
  UPDATE_PERSP_DETAILS,
  GET_PERSP_DETAILS,
  hashCid,
  hashText,
  ADD_PERSP_BATCH
} from './common';
import { EveesAccessControlEthereum } from './evees-access-control.ethereum';
import { ProposalsEthereum } from './proposals.ethereum';
import { ProposalsProvider } from '../../proposals.provider';
import { NewPerspectiveData } from 'src/services/evees.provider.js';

const evees_if = 'evees-v0';

export interface NewEthPerspectiveData {
  perspectiveIdHash: string;
  contextHash: string;
  headId: string;
  context: string;
  name: string;
  owner: string;
  perspectiveId: string;
}

export class EveesEthereum extends EthereumProvider implements EveesRemote {
  logger: Logger = new Logger('EveesEtereum');

  ipfsSource: IpfsSource;
  accessControl: EveesAccessControlEthereum;
  proposals: ProposalsProvider;
  userId?: string | undefined;
  knownSources?: KnownSourcesService | undefined;
  hashRecipe: CidConfig;

  constructor(
    protected ethConnection: EthereumConnection,
    ipfsConnection: IpfsConnection,
    ethOptions: EthereumProviderOptions = { contract: EveesContractArtifact as any },
    hashRecipe: CidConfig
  ) {
    super(ethOptions, ethConnection);
    this.ipfsSource = new IpfsSource(ipfsConnection, hashRecipe);
    this.accessControl = new EveesAccessControlEthereum(this);
    this.proposals = new ProposalsEthereum(this, this.ipfsSource, this.accessControl);
    this.hashRecipe = hashRecipe;
  }

  get authority() {
    return `eth-${
      this.ethConnection.networkId
    }:${evees_if}:${this.contractInstance.options.address.toLocaleLowerCase()}`;
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

  async persistPerspectiveEntity(secured: Secured<Perspective>) {
    const perspectiveId = await this.ipfsSource.addObject(sortObject(secured.object));
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
    if (!secured.object.payload.origin) throw new Error('origin cannot be empty');

    /** Store the perspective data in the data layer */
    const perspectiveId = await this.persistPerspectiveEntity(secured);

    const perspectiveIdHash = await hashCid(perspectiveId);
    let contextHash;
    if (details.context) {
      contextHash = await hashText(details.context);
    } else {
      contextHash = '0x' + new Array(32).fill(0).join('');
    }

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.send(ADD_PERSP, [
      perspectiveIdHash,
      contextHash,
      details.headId ? details.headId : '',
      details.context ? details.context : '',
      details.name ? details.name : '',
      canWrite ? canWrite : this.ethConnection.getCurrentAccount(),
      perspectiveId
    ]);
  }

  async clonePerspectivesBatch(newPerspectivesData: NewPerspectiveData[]): Promise<void> {
    const persistPromises = newPerspectivesData.map(perspectiveData => {
      return this.persistPerspectiveEntity(perspectiveData.perspective);
    });

    await Promise.all(persistPromises);

    const ethPerspectivesDataPromises = newPerspectivesData.map(
      async (perspectiveData): Promise<NewEthPerspectiveData> => {
        const perspectiveIdHash = await hashCid(perspectiveData.perspective.id);

        let contextHash;
        if (perspectiveData.details.context) {
          contextHash = await hashText(perspectiveData.details.context);
        } else {
          contextHash = '0x' + new Array(32).fill(0).join('');
        }

        const zero = '0x' + new Array(32).fill(0).join('');

        return {
          perspectiveIdHash,
          contextHash,
          headId: perspectiveData.details.headId ? perspectiveData.details.headId : zero,
          context: perspectiveData.details.context ? perspectiveData.details.context : '',
          name: perspectiveData.details.name,
          owner: perspectiveData.canWrite
            ? perspectiveData.canWrite
            : this.ethConnection.getCurrentAccount(),
          perspectiveId: perspectiveData.perspective.id
        };
      }
    );

    const ethPerspectivesData = await Promise.all(ethPerspectivesDataPromises);

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    await this.send(ADD_PERSP_BATCH, [ethPerspectivesData]);
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
      '0x' + new Array(32).fill(0).join(''),
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
    let contextHash = '0x' + new Array(32).fill(0).join('');

    if (details.context) {
      contextHash = await hashText(details.context);
    }

    await this.send(UPDATE_PERSP_DETAILS, [
      perspectiveIdHash,
      contextHash,
      details.headId || '',
      details.context || '',
      details.name || ''
    ]);
  }

  async hashToId(perspectiveIdHash: string) {
    /** check the creation event to reverse map the cid */
    const perspectiveAddedEvents = await this.contractInstance.getPastEvents('PerspectiveAdded', {
      filter: { perspectiveIdHash: perspectiveIdHash },
      fromBlock: 0
    });

    /** one event should exist only */
    const perspectiveAddedEvent = perspectiveAddedEvents[0];

    return perspectiveAddedEvent.returnValues.perspectiveId;
  }

  /**
   * @override
   */
  async getContextPerspectives(context: string): Promise<string[]> {
    const contextHash = await hashText(context);

    let perspectiveContextUpdatedEvents = await this.contractInstance.getPastEvents(
      'PerspectiveAdded',
      {
        filter: { contextHash: contextHash },
        fromBlock: 0
      }
    );

    let perspectiveIdHashes = perspectiveContextUpdatedEvents.map(
      e => e.returnValues.perspectiveIdHash
    );

    const hashToIdPromises = perspectiveIdHashes.map(idHash => this.hashToId(idHash));
    this.logger.log(`[ETH] getContextPerspectives of ${context}`, perspectiveIdHashes);

    return Promise.all(hashToIdPromises);
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
