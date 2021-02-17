import { ChainConnectionDetails } from '@uprtcl/evees-blockchain';

export const POLKADOT_CONNECTION_NAME = 'POLKADOT-CONNECTION-NAME';

const chainConnectionDetails: ChainConnectionDetails = {
  'kusama-parity': {
    name: 'Kusama',
    image: '',
    hostName: 'Parity',
    endpoint: 'wss://kusama-rpc.polkadot.io',
  },
  'kusama-web3': {
    name: 'Kusama',
    image: '',
    hostName: 'Web3 Foundation',
    endpoint: 'wss://cc3-5.kusama.network',
  },
  'local-dev': {
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
    if (connectionId === 'CUSTOM') {
      const customEndpoint = localStorage.getItem('POLKADOT-CONNECTION-ENDPOINT');
      chainConnectionDetails['CUSTOM'] = {
        name: 'Custom',
        image: '',
        hostName: '-',
        endpoint: customEndpoint as string,
      };
    }
  } else {
    connectionId = 'local-host';
    setConnectionId(connectionId);
  }
  return {
    connections: chainConnectionDetails,
    current: connectionId,
  };
}
