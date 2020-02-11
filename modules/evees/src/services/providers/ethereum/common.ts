import multihashing from 'multihashing-async';
import CID from 'cids';

/** Function signatures */
export const ADD_PERSP = 'addPerspective(bytes32,bytes32,string,string,string,address,string)';
export const UPDATE_HEADS = 'updateHeads((bytes32,string,uint8)[])';
export const UPDATE_PERSP_DETAILS = 'updatePerspectiveDetails(bytes32,bytes32,string,string,string)';
export const GET_PERSP_DETAILS = 'getPerspectiveDetails(bytes32)';
export const UPDATE_OWNER = 'changeOwner(bytes32,address)';
export const ADD_PERSP_BATCH = 'addPerspectiveBatch((bytes32,bytes32,string,string,string,address,string)[])';

export const INIT_REQUEST =
  'initRequest(bytes32,bytes32,address,uint32,(bytes32,string,uint8)[],address[],string,string)';
export const GET_REQUEST = 'getRequest(bytes32)';
export const EXECUTE_REQUEST = 'executeRequest(bytes32)';
export const AUTHORIZE_REQUEST = 'setRequestAuthorized(bytes32,uint8)';
export const GET_REQUEST_ID = 'getRequestId(bytes32,bytes32,uint32)';

/** hashes the cid to fit in a bytes32 word */
export const hashCid = async (perspectiveCidStr: string) => {
  const cid = new CID(perspectiveCidStr);
  const encoded = await multihashing.digest(cid.buffer, 'sha2-256');
  return '0x' + encoded.toString('hex');
};

export const hashText = async (text: string) => {
  const encoded = await multihashing.digest(Buffer.from(text), 'sha2-256');
  return '0x' + encoded.toString('hex');
};
