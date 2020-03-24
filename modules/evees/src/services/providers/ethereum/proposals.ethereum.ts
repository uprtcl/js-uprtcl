import { Logger } from '@uprtcl/micro-orchestrator';
import { EthereumContract } from '@uprtcl/ethereum-provider';

import { ProposalsProvider } from '../../proposals.provider';
import { UpdateRequest, Proposal } from '../../../types';
import { INIT_PROPOSAL, GET_PROPOSAL, AUTHORIZE_PROPOSAL, EXECUTE_PROPOSAL, GET_PERSP_HASH, cidToHex32, bytes32ToCid, GET_PROPOSAL_ID } from './common';
import { EveesAccessControlEthereum } from './evees-access-control.ethereum';
import { hashToId, ZERO_HEX_32 } from './evees.ethereum';

export interface EthHeadUpdate {
  perspectiveIdHash: string;
  headCid1: string;
  headCid0: string;
  executed: string;
}
export class ProposalsEthereum implements ProposalsProvider {
  
  logger = new Logger('PROPOSALS-ETHEREUM');

  constructor(
    protected uprtclRoot: EthereumContract,
    protected uprtclProposals: EthereumContract,
    protected accessControl: EveesAccessControlEthereum
  ) {}

  async ready(): Promise<void> {
    await Promise.all([this.uprtclProposals.ready()]);
  }

  async createProposal(
    fromPerspectiveId: string,
    toPerspectiveId: string,
    headUpdates: UpdateRequest[]
  ): Promise<string> {
    await this.ready();

    this.logger.info('createProposal()', { fromPerspectiveId, toPerspectiveId, headUpdates });

    /** verify all perspectives are owned by the owner of the to perspective (which might not be in the updateHead list) */
    const accessData = await this.accessControl.getPermissions(toPerspectiveId);
    
    if (!accessData)
      throw new Error(`access control data not found for target perspective ${toPerspectiveId}`);

    const verifyPromises = headUpdates.map(async headUpdate => {
      const permissions = await this.accessControl.getPermissions(
        headUpdate.perspectiveId
      );
      if (!permissions)
        throw new Error(`access control data not found for target perspective ${toPerspectiveId}`);

      if (permissions.owner !== accessData.owner) {
        throw new Error(
          `perspective ${headUpdate.perspectiveId} in request not owned by target perspective owner ${accessData.owner} but by ${permissions.owner}`
        );
      }
    });

    await Promise.all(verifyPromises);

    /** TX is sent, and await to force order (preent head update on an unexisting perspective) */
    const nonce = 0;

    const ethHeadUpdatesPromises = headUpdates.map(
      async (update): Promise<EthHeadUpdate> => {
        const headCidParts = update.newHeadId ? cidToHex32(update.newHeadId) : [ZERO_HEX_32, ZERO_HEX_32];

        return {
          perspectiveIdHash: await this.uprtclRoot.call(GET_PERSP_HASH, [update.perspectiveId]),
          headCid1: headCidParts[0],
          headCid0: headCidParts[1],
          executed: "0"
        };
      }
    );

    const ethHeadUpdates = await Promise.all(ethHeadUpdatesPromises);

    const proposal = {
      toPerspectiveId: toPerspectiveId, 
      fromPerspectiveId: fromPerspectiveId, 
      owner: accessData.owner, 
      nonce: nonce, 
      headUpdates: ethHeadUpdates, 
      approvedAddresses: []
    }

    await this.uprtclProposals.send(INIT_PROPOSAL, [
      proposal, this.uprtclProposals.userId
    ]);

    const requestId = this.uprtclProposals.call(GET_PROPOSAL_ID, [toPerspectiveId, fromPerspectiveId, nonce]);
    
    this.logger.info('createProposal() - post', { requestId, headUpdates });

    return requestId;
  }

  async getProposal(requestId: string): Promise<Proposal> {
    await this.ready();

    this.logger.info('getProposal() - pre', { requestId });

    const request = await this.uprtclProposals.call(
      GET_PROPOSAL, 
      [ requestId ]);
    
    const ethHeadUpdates = request.headUpdates;

    const updatesPromises = ethHeadUpdates.map(async (ethUpdateRequest) => {
      const perspectiveId = await hashToId(this.uprtclRoot, ethUpdateRequest.perspectiveIdHash);
      const headId = bytes32ToCid([ethUpdateRequest.headCid1, ethUpdateRequest.headCid0]);
      return {
        perspectiveId: perspectiveId,
        newHeadId: headId
      }
    });

    const updates: any = await Promise.all(updatesPromises);
    
    const executed = (ethHeadUpdates.find((update:any) => update.executed === "0") === undefined);
    const canAuthorize = (this.uprtclProposals.userId !== undefined) ? 
      (request.owner.toLocaleLowerCase() === this.uprtclProposals.userId.toLocaleLowerCase()) :
      false;

    const proposal: Proposal = {
      id: requestId,
      creatorId: '',
      toPerspectiveId: request.toPerspectiveId,
      fromPerspectiveId: request.fromPerspectiveId,
      updates: updates,
      status: request.status === '1',
      authorized: request.authorized === '1',
      executed: executed,
      canAuthorize: canAuthorize
    }

    this.logger.info('getProposal() - post', { proposal });

    return proposal;
  }

  async getProposalsToPerspective(perspectiveId: string): Promise<string[]> {
    await this.ready();

    this.logger.info('getProposalsToPerspective() - pre', { perspectiveId });

    let requestsCreatedEvents = await this.uprtclProposals.contractInstance.getPastEvents(
      'ProposalCreated', {
        filter: { toPerspectiveIdHash: await this.uprtclRoot.call(GET_PERSP_HASH, [perspectiveId]) },
        fromBlock: 0
      }
    )

    const requestsIds = requestsCreatedEvents.map((event) => {
      return event.returnValues.proposalId;
    })

    this.logger.info('getProposalsToPerspective() - post', { requestsIds });
    
    return requestsIds;
  }

  addUpdatesToProposal(proposalId: string, updates: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  freezeProposal(proposalId: string, updates: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  cancelProposal(proposalId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  declineProposal(proposalId: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async acceptProposal(proposalId: string[]): Promise<void> {
    await this.ready();

    this.logger.info('acceptProposal()', { proposalId });

    await this.uprtclProposals.send(AUTHORIZE_PROPOSAL, [
      proposalId,
      1,
      true
    ]);
  }

  async executeProposal(proposalId: string[]): Promise<void> {
    await this.ready();

    this.logger.info('executeProposal()', { proposalId });

    await this.uprtclProposals.send(EXECUTE_PROPOSAL, [
      proposalId
    ]);
  }

}
