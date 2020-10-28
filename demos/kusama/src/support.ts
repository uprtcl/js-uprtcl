const newPerspStr = '(string,bytes32,bytes32,address)';
const initPerspStr = `(${newPerspStr},string)`;

export const CREATE_AND_SET_HOME = `createAndSetHome(${initPerspStr},address)`;
export const SET_HOME = `setHomePerspectivePublic(string)`;

export const getHomePerspective = async (uprtclHome, address) => {
  const events = await uprtclHome.getPastEvents('HomePerspectiveSet', {
    filter: { owner: address },
    fromBlock: 0
  });

  if (events.length === 0) return '';

  const last = events.sort((e1, e2) => (e1.blockNumber > e2.blockNumber ? 1 : -1)).pop();

  return last.returnValues.perspectiveId;
};

export const ZERO_HEX_32 = '0x' + new Array(32).fill(0).join('');
