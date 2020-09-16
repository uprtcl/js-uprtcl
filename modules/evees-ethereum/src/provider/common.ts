import * as multihashing from 'multihashing-async';
import CID from 'cids';

import { EthereumContract } from '@uprtcl/ethereum-provider';
import { NewPerspectiveData } from '@uprtcl/evees';

/** Function signatures */
const newPerspStr = '(string,bytes32,bytes32,address)';
export const GET_PERSP_HASH = 'getPerspectiveIdHash(string)';
export const GET_PERSP_OWNER = 'getPerspectiveOwner(bytes32)';
export const CREATE_PERSP = `createPerspective(${newPerspStr},address)`;
export const UPDATE_OWNER = 'changePerspectiveOwner(bytes32,address)';
export const UPDATE_OWNER_BATCH = 'changePerspectiveOwnerBatch(bytes32[],address)';
export const CREATE_PERSP_BATCH = `createPerspectiveBatch(${newPerspStr}[],address)`;
export const UPDATED_HEAD = `updateHead(bytes32,bytes32,bytes32,address)`;

const initPerspStr = `(${newPerspStr},string)`;
export const GET_CONTEXT_HASH = 'getContextHash(string)';
export const UPDATE_PERSP_DETAILS = `setPerspectiveDetails(bytes32,string)`;
export const GET_PERSP_DETAILS = 'getPerspectiveDetails(bytes32)';
export const INIT_PERSP = `initPerspective(${initPerspStr},address)`;
export const INIT_PERSP_BATCH = `initPerspectiveBatch(${initPerspStr}[],address)`;

const headUpdate = `(bytes32,bytes32,bytes32,string,string)`;
const proposalStr = `(string,string,string,string,address,uint256,${headUpdate}[],address[])`;
export const INIT_PROPOSAL = `initProposal(${proposalStr},address)`;
export const GET_PROPOSAL = 'getProposal(bytes32)';
export const EXECUTE_PROPOSAL = 'executeProposal(bytes32)';
export const AUTHORIZE_PROPOSAL = 'authorizeProposal(bytes32,uint8,bool)';
export const GET_PROPOSAL_ID = 'getProposalId(string,string,uint256)';

/** wrapper */
export const CREATE_AND_PROPOSE = `createAndInitProposal((${newPerspStr},string)[],${proposalStr},address)`;

export const ZERO_HEX_32 = '0x' + new Array(32).fill(0).join('');
export const ZERO_ADDRESS = '0x' + new Array(40).fill(0).join('');

export const hashText = async (text: string) => {
  const encoded = await multihashing.digest(Buffer.from(text), 'sha2-256');
  return '0x' + encoded.toString('hex');
};

export const hashToId = async (uprtclRoot: EthereumContract, perspectiveIdHash: string) => {
  /** check the creation event to reverse map the cid */
  let filter = uprtclRoot.contractInstance.filters.PerspectiveCreated(perspectiveIdHash, null);

  let perspectiveAddedEvents = await uprtclRoot.contractInstance.queryFilter(filter, 0);

  /** one event should exist only */
  const perspectiveAddedEvent = perspectiveAddedEvents[0];

  if (!perspectiveAddedEvent) {
    throw new Error(`Perspective with hash ${perspectiveIdHash} not found`);
  }

  return perspectiveAddedEvent.args ? perspectiveAddedEvent.args.perspectiveId : undefined;
};

export const getEthPerspectiveHead = async (uprtclRoot, perspectiveIdHash) => {
  const filter = uprtclRoot.filters.PerspectiveHeadUpdated(perspectiveIdHash, null, null);

  const events = await uprtclRoot.queryFilter(filter, 0);

  if (events.length === 0) return undefined;

  const last = events.sort((e1, e2) => (e1.blockNumber > e2.blockNumber ? 1 : -1)).pop();

  return {
    headCid1: last.args.headCid1,
    headCid0: last.args.headCid0
  };
};

export const getEthPerspectiveContext = async (uprtclDetails, perspectiveIdHash) => {
  const filter = uprtclDetails.filters.PerspectiveDetailsSet(perspectiveIdHash, null);
  const events = await uprtclDetails.queryFilter(filter, 0);

  if (events.length === 0) return undefined;

  const last = events.sort((e1, e2) => (e1.blockNumber > e2.blockNumber ? 1 : -1)).pop();

  return last.args.context;
};

export interface ProposalDetails {
  toPerspectiveId: string;
  fromPerspectiveId: string;
  toHeadId: string;
  fromHeadId: string;
  nonce: number;
}

export const getProposalDetails = async (uprtclProposals, proposalId): Promise<ProposalDetails> => {
  const filter = uprtclProposals.filters.ProposalCreated(
    null,
    null,
    proposalId,
    null,
    null,
    null,
    null,
    null,
    null
  );

  const events = await uprtclProposals.queryFilter(filter, 0);

  if (events.length !== 1) throw Error('One proposal created event expected');

  const e = events[0];

  return {
    toPerspectiveId: e.args.toPerspectiveId,
    fromPerspectiveId: e.args.fromPerspectiveId,
    toHeadId: e.args.toHeadId,
    fromHeadId: e.args.fromHeadId,
    nonce: e.args.fromHeadId
  };
};

export interface HeadUpdateDetails {
  fromPerspectiveId: string;
  fromHeadId: string;
}

export const getHeadUpdateDetails = async (
  uprtclProposals,
  proposalId,
  perspectiveIdHash
): Promise<HeadUpdateDetails> => {
  const filter = uprtclProposals.filters.HeadUpdateAdded(proposalId, perspectiveIdHash, null, null);
  const events = await uprtclProposals.queryFilter(filter, 0);

  if (events.length !== 1) throw Error('One headupte per perspective and proposal expected');

  const e = events[0];

  return {
    fromPerspectiveId: e.args.fromPerspectiveId,
    fromHeadId: e.args.fromHeadId
  };
};

export interface PerspectiveCreator {
  preparePerspectives(newPerspectivesData: NewPerspectiveData[]);
}
