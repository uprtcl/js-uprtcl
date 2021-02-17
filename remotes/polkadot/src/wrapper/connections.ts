import { ChainConnectionDetails } from '@uprtcl/evees-blockchain';

export const POLKADOT_CONNECTION_NAME = 'POLKADOT-CONNECTION-NAME';
export const KUSAMA_PARITY_CONNECTION = 'kusama-parity';
export const KUSAMA_WEB3_CONNECTION = 'kusama-web3';
export const KUSAMA_LOCAL_DEV = 'local-dev';
export const KUSAMA_CUSTOM = 'custom';

const chainConnectionDetails: ChainConnectionDetails = {
  [KUSAMA_PARITY_CONNECTION]: {
    name: 'Kusama',
    image: '',
    hostName: 'Parity',
    endpoint: 'wss://kusama-rpc.polkadot.io',
  },
  [KUSAMA_WEB3_CONNECTION]: {
    name: 'Kusama',
    image: '',
    hostName: 'Web3 Foundation',
    endpoint: 'wss://cc3-5.kusama.network',
  },
  [KUSAMA_LOCAL_DEV]: {
    name: 'Local',
    image: '',
    hostName: 'Local',
    endpoint: 'ws://127.0.0.1:9944',
  },
};

export function setConnectionId(id: string = 'local-dev') {
  localStorage.setItem(POLKADOT_CONNECTION_NAME, id);
}

export function getConnectionDetails() {
  let connectionId = localStorage.getItem(POLKADOT_CONNECTION_NAME);

  if (connectionId) {
    if (connectionId === KUSAMA_CUSTOM) {
      const customEndpoint = localStorage.getItem('POLKADOT-CONNECTION-ENDPOINT');
      chainConnectionDetails[KUSAMA_CUSTOM] = {
        name: 'Custom',
        image: '',
        hostName: '-',
        endpoint: customEndpoint as string,
      };
    }
  } else {
    connectionId = KUSAMA_LOCAL_DEV;
    setConnectionId(connectionId);
  }
  return {
    connections: chainConnectionDetails,
    current: connectionId,
  };
}
