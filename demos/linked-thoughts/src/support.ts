import CID from 'cids';

const newPerspStr = '(string,bytes32,bytes32,address)';
const initPerspStr = `(${newPerspStr},string)`;

export const CREATE_AND_SET_HOME = `createAndSetHome(${initPerspStr},address)`;
export const SET_HOME = `setHomePerspectivePublic(string)`;

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

export const getHomePerspective = async (uprtclHome, address) => {
  const events = await uprtclHome.getPastEvents('HomePerspectiveSet', {
    filter: { owner: address },
    fromBlock: 0,
  });

  if (events.length === 0) return '';

  const last = events
    .sort((e1, e2) => (e1.blockNumber > e2.blockNumber ? 1 : -1))
    .pop();

  return last.returnValues.perspectiveId;
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

export const ZERO_HEX_32 = '0x' + new Array(32).fill(0).join('');
