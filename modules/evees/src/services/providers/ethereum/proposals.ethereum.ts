import { Logger } from '@uprtcl/micro-orchestrator';
import { EthereumContract } from '@uprtcl/ethereum-provider';

import { ProposalsProvider } from '../../proposals.provider';
import { UpdateRequest, Proposal, NewProposal, NewPerspectiveData } from '../../../types';
import {
  INIT_PROPOSAL,
  GET_PROPOSAL,
  AUTHORIZE_PROPOSAL,
  EXECUTE_PROPOSAL,
  GET_PERSP_HASH,
  cidToHex32,
  bytes32ToCid,
  GET_PROPOSAL_ID,
  getProposalDetails,
  getHeadUpdateDetails,
  CREATE_AND_PROPOSE,
} from './common';
import { EveesAccessControlEthereum } from './evees-access-control.ethereum';
import { hashToId, ZERO_HEX_32, EveesEthereum } from './evees.ethereum';

export interface EthHeadUpdate {
  perspectiveIdHash: string;
  headCid1: string;
  headCid0: string;
  fromPerspectiveId: string;
  fromHeadId: string;
}
export class ProposalsEthereum implements ProposalsProvider {
  logger = new Logger('PROPOSALS-ETHEREUM');

  constructor(
    protected uprtclRoot: EthereumContract,
    protected uprtclProposals: EthereumContract,
    protected uprtclWrapper: EthereumContract,
    protected accessControl: EveesAccessControlEthereum,
    protected eveesEthereum: EveesEthereum
  ) {}

  async ready(): Promise<void> {
    await Promise.all([this.uprtclProposals.ready()]);
  }

  async prepareProposal(proposal: NewProposal) {
    /** verify all perspectives are owned by the owner of the to perspective (which might not be in the updateHead list) */
    const accessData = await this.accessControl.getPermissions(proposal.toPerspectiveId);

    if (!accessData)
      throw new Error(
        `access control data not found for target perspective ${proposal.toPerspectiveId}`
      );

    const verifyPromises = proposal.updates.map(async (headUpdate) => {
      const permissions = await this.accessControl.getPermissions(headUpdate.perspectiveId);
      if (!permissions)
        throw new Error(
          `access control data not found for target perspective ${proposal.toPerspectiveId}`
        );

      if (permissions.owner !== accessData.owner) {
        throw new Error(
          `perspective ${headUpdate.perspectiveId} in request not owned by target perspective owner ${accessData.owner} but by ${permissions.owner}`
        );
      }
    });

    await Promise.all(verifyPromises);

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    const nonce = Date.now();

    const ethHeadUpdatesPromises = proposal.updates.map(
      async (update): Promise<EthHeadUpdate> => {
        const headCidParts = update.newHeadId
          ? cidToHex32(update.newHeadId)
          : [ZERO_HEX_32, ZERO_HEX_32];

        return {
          perspectiveIdHash: await this.uprtclRoot.call(GET_PERSP_HASH, [update.perspectiveId]),
          headCid1: headCidParts[0],
          headCid0: headCidParts[1],
          fromPerspectiveId: update.fromPerspectiveId ? update.fromPerspectiveId : '',
          fromHeadId: update.oldHeadId ? update.oldHeadId : '',
        };
      }
    );

    const ethHeadUpdates = await Promise.all(ethHeadUpdatesPromises);

    const ethProposal = {
      toPerspectiveId: proposal.toPerspectiveId,
      fromPerspectiveId: proposal.fromPerspectiveId,
      toHeadId: proposal.toHeadId,
      fromHeadId: proposal.fromHeadId,
      owner: accessData.owner,
      nonce: nonce,
      headUpdates: ethHeadUpdates,
      approvedAddresses: [],
    };

    return ethProposal;
  }

  async createProposal(proposal: NewProposal): Promise<string> {
    await this.ready();

    this.logger.info('createProposal()', { proposal });

    const ethProposal = await this.prepareProposal(proposal);

    await this.uprtclProposals.send(INIT_PROPOSAL, [ethProposal, this.uprtclProposals.userId]);

    const requestId = this.uprtclProposals.call(GET_PROPOSAL_ID, [
      proposal.toPerspectiveId,
      proposal.fromPerspectiveId,
      ethProposal.nonce,
    ]);

    this.logger.info('createProposal() - post', { requestId, updates: proposal.updates });

    return requestId;
  }

  async createAndPropose(
    newPerspectivesData: NewPerspectiveData[],
    proposal: NewProposal
  ): Promise<string> {
    await this.ready();

    this.logger.info('createAndPropose()', { proposal });

    const ethProposal = await this.prepareProposal(proposal);
    const ethPerspectives = await this.eveesEthereum.preparePerspectives(newPerspectivesData);

    await this.uprtclWrapper.send(CREATE_AND_PROPOSE, [
      ethPerspectives,
      ethProposal,
      this.uprtclProposals.userId,
    ]);

    const requestId = this.uprtclProposals.call(GET_PROPOSAL_ID, [
      proposal.toPerspectiveId,
      proposal.fromPerspectiveId,
      ethProposal.nonce,
    ]);

    this.logger.info('createProposal() - post', { requestId, updates: proposal.updates });

    return requestId;
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    await this.ready();

    this.logger.info('getProposal() - pre', { proposalId });

    const ethProposal = await this.uprtclProposals.call(GET_PROPOSAL, [proposalId]);

    const ethProposalDetails = await getProposalDetails(
      this.uprtclProposals.contractInstance,
      proposalId
    );

    const ethHeadUpdates = ethProposal.headUpdates;

    const updatesPromises = ethHeadUpdates.map(
      async (ethUpdateRequest): Promise<UpdateRequest> => {
        const perspectiveId = await hashToId(this.uprtclRoot, ethUpdateRequest.perspectiveIdHash);
        const headId = bytes32ToCid([ethUpdateRequest.headCid1, ethUpdateRequest.headCid0]);
        const headUpdateDetails = await getHeadUpdateDetails(
          this.uprtclProposals.contractInstance,
          proposalId,
          ethUpdateRequest.perspectiveIdHash
        );

        return {
          perspectiveId: perspectiveId,
          newHeadId: headId,
          fromPerspectiveId: headUpdateDetails.fromPerspectiveId,
          oldHeadId: headUpdateDetails.fromHeadId,
        };
      }
    );

    const updates: any = await Promise.all(updatesPromises);

    const executed = ethHeadUpdates.find((update: any) => update.executed === '0') === undefined;
    const canAuthorize =
      this.uprtclProposals.userId !== undefined
        ? ethProposal.owner.toLocaleLowerCase() === this.uprtclProposals.userId.toLocaleLowerCase()
        : false;

    const proposal: Proposal = {
      id: proposalId,
      creatorId: '',
      toPerspectiveId: ethProposalDetails.toPerspectiveId,
      fromPerspectiveId: ethProposalDetails.fromPerspectiveId,
      toHeadId: ethProposalDetails.toHeadId,
      fromHeadId: ethProposalDetails.fromHeadId,
      updates: updates,
      status: ethProposal.status === '1',
      authorized: ethProposal.authorized === '1',
      executed: executed,
      canAuthorize: canAuthorize,
    };

    this.logger.info('getProposal() - post', { proposal });

    return proposal;
  }

  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    await this.ready();

    this.logger.info('getProposalsToPerspective() - pre', { perspectiveId });

    let requestsCreatedEvents = await this.uprtclProposals.contractInstance.getPastEvents(
      'ProposalCreated',
      {
        filter: {
          toPerspectiveIdHash: await this.uprtclRoot.call(GET_PERSP_HASH, [perspectiveId]),
        },
        fromBlock: 0,
      }
    );

    const requestsIds = requestsCreatedEvents.map((event) => {
      return event.returnValues.proposalId;
    });

    this.logger.info('getProposalsToPerspective() - post', { requestsIds });

    return requestsIds;
  }

  addUpdatesToProposal(proposalId: string, updates: any[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  freezeProposal(proposalId: string, updates: any[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  cancelProposal(proposalId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  declineProposal(proposalId: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async acceptProposal(proposalId: string[]): Promise<void> {
    await this.ready();

    this.logger.info('acceptProposal()', { proposalId });

    await this.uprtclProposals.send(AUTHORIZE_PROPOSAL, [proposalId, 1, true]);
  }

  async executeProposal(proposalId: string[]): Promise<void> {
    await this.ready();

    this.logger.info('executeProposal()', { proposalId });

    await this.uprtclProposals.send(EXECUTE_PROPOSAL, [proposalId]);
  }
}
