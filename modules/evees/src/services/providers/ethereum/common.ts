import multihashing from 'multihashing-async';
import CID from 'cids';

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

export const hashText = async (text: string) => {
  const encoded = await multihashing.digest(Buffer.from(text), 'sha2-256');
  return '0x' + encoded.toString('hex');
};

const constants: [string, number][] = [
  ['base8', 37],
  ['base10', 39],
  ['base16', 66],
  ['base32', 62],
  ['base32pad', 63],
  ['base32hex', 76],
  ['base32hexpad', 74],
  ['base32z', 68],
  ['base58flickr', 90],
  ['base58btc', 122],
  ['base64', 109],
  ['base64pad', 77],
  ['base64url', 75],
  ['Ubase64urlpad', 55],
];

const multibaseToUint = (multibaseName: string): number => {
  return constants.filter((e) => e[0] == multibaseName)[0][1];
};

const uintToMultibase = (number: number): string => {
  return constants.filter((e) => e[1] == number)[0][0];
};

export const cidToHex32 = (cidStr) => {
  /** store the encoded cids as they are, including the multibase bytes */
  const cid = new CID(cidStr);
  const bytes = cid.buffer;

  /* push the code of the multibse (UTF8 number of the string) */
  const firstByte = new Buffer(1).fill(multibaseToUint(cid.multibaseName));
  const arr = [firstByte, bytes];
  const bytesWithMultibase = Buffer.concat(arr);

  /** convert to hex */
  let cidEncoded16 = bytesWithMultibase.toString('hex');
  /** pad with zeros */
  cidEncoded16 = cidEncoded16.padStart(128, '0');

  const cidHex0 = cidEncoded16.slice(-64); /** LSB */
  const cidHex1 = cidEncoded16.slice(-128, -64);

  return ['0x' + cidHex1, '0x' + cidHex0];
};

export const bytes32ToCid = (bytes) => {
  const cidHex1 = bytes[0].substring(2);
  const cidHex0 = bytes[1].substring(2); /** LSB */

  const cidHex = cidHex1.concat(cidHex0).replace(/^0+/, '');
  if (cidHex === '') return '';

  const cidBufferWithBase = Buffer.from(cidHex, 'hex');

  const multibaseCode = cidBufferWithBase[0];
  const cidBuffer = cidBufferWithBase.slice(1);

  const multibaseName = uintToMultibase(multibaseCode);

  /** Force Buffer class */
  const cid = new CID(cidBuffer);

  return cid.toBaseEncodedString(multibaseName);
};

export const getEthPerspectiveHead = async (uprtclRoot, perspectiveIdHash) => {
  const events = await uprtclRoot.getPastEvents('PerspectiveHeadUpdated', {
    filter: { perspectiveIdHash: perspectiveIdHash },
    fromBlock: 0,
  });

  if (events.length === 0) return undefined;

  const last = events.sort((e1, e2) => (e1.blockNumber > e2.blockNumber ? 1 : -1)).pop();

  return {
    headCid1: last.returnValues.headCid1,
    headCid0: last.returnValues.headCid0,
  };
};

export const getEthPerspectiveContext = async (uprtclDetails, perspectiveIdHash) => {
  const events = await uprtclDetails.getPastEvents('PerspectiveDetailsSet', {
    filter: { perspectiveIdHash: perspectiveIdHash },
    fromBlock: 0,
  });

  if (events.length === 0) return undefined;

  const last = events.sort((e1, e2) => (e1.blockNumber > e2.blockNumber ? 1 : -1)).pop();

  return last.returnValues.context;
};

export interface ProposalDetails {
  toPerspectiveId: string;
  fromPerspectiveId: string;
  toHeadId: string;
  fromHeadId: string;
  nonce: number;
}

export const getProposalDetails = async (uprtclProposals, proposalId): Promise<ProposalDetails> => {
  const events = await uprtclProposals.getPastEvents('ProposalCreated', {
    filter: { proposalId },
    fromBlock: 0,
  });

  if (events.length !== 1) throw Error('One proposal created event expected');

  const e = events[0];

  return {
    toPerspectiveId: e.returnValues.toPerspectiveId,
    fromPerspectiveId: e.returnValues.fromPerspectiveId,
    toHeadId: e.returnValues.toHeadId,
    fromHeadId: e.returnValues.fromHeadId,
    nonce: e.returnValues.fromHeadId,
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
  const events = await uprtclProposals.getPastEvents('HeadUpdateAdded', {
    filter: { proposalId, perspectiveIdHash },
    fromBlock: 0,
  });

  if (events.length !== 1) throw Error('One headupte per perspective and proposal expected');

  const e = events[0];

  return {
    fromPerspectiveId: e.returnValues.fromPerspectiveId,
    fromHeadId: e.returnValues.fromHeadId,
  };
};
