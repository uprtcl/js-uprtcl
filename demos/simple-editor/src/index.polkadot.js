import IPFS from 'ipfs';

import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { LensesModule } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';

import { CortexModule } from '@uprtcl/cortex';
import { EveesModule } from '@uprtcl/evees';
import {
  EveesPolkadotCouncil,
  PolkadotOrbitDBIdentity,
  PolkadotConnection,
  EveesPolkadotConnection,
  EveesPolkadotModule
} from '@uprtcl/evees-polkadot';
import { EveesBlockchainCached, EveesBlockchainModule } from '@uprtcl/evees-blockchain';
import {
  ProposalsOrbitDB,
  ProposalStore,
  ProposalsToPerspectiveStore,
  ContextStore,
  getContextAcl,
  getProposalsAcl,
  EveesOrbitDBModule
} from '@uprtcl/evees-orbitdb';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { OrbitDBCustom, AddressMapping } from '@uprtcl/orbitdb-provider';
import { EveesLocalModule } from '@uprtcl/evees-local';

import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import { SimpleWiki } from './simple-wiki';

import { env } from '../env';

(async function() {
  const ipfsCidConfig = {
    version: 1,
    type: 'sha2-256',
    codec: 'raw',
    base: 'base58btc'
  };
  const ipfsJSConfig = {
    preload: { enabled: false },
    relay: { enabled: true, hop: { enabled: true, active: true } },
    EXPERIMENTAL: { pubsub: true },
    config: {
      init: true,
      Addresses: {
        Swarm: env.pinner.Swarm
      },
      Bootstrap: env.pinner.Bootstrap
    }
  };

  const orchestrator = new MicroOrchestrator();

  const chainConnectionDetails = {
    'local-dev': {
      name: 'Local',
      image: '',
      host: 'Local',
      endpoint: 'ws://127.0.0.1:9944'
    },
    'kusama-parity': {
      name: 'Kusama',
      image: '',
      host: 'Parity',
      endpoint: 'wss://kusama-rpc.polkadot.io'
    },
    'kusama-web3': {
      name: 'Kusama',
      image: '',
      host: 'Web3 Foundation',
      endpoint: 'wss://cc3-5.kusama.network'
    }
  };

  let connectionName = localStorage.getItem('POLKADOT-CONNECTION-NAME');

  if (connectionName) {
    if (connectionName === 'CUSTOM') {
      const customEndpoint = localStorage.getItem('POLKADOT-CONNECTION-ENDPOINT');
      chainConnectionDetails['CUSTOM'] = {
        name: 'Custom',
        image: '',
        host: 'Web3 Foundation',
        endpoint: customEndpoint
      };
    }
  } else {
    connectionName = 'local-dev';
    localStorage.setItem('POLKADOT-CONNECTION-NAME', connectionName);
  }
  console.log(`connecting to polkadot`, connectionName);
  const pkdConnection = new PolkadotConnection(chainConnectionDetails, connectionName);
  await pkdConnection.ready();

  const ipfs = await IPFS.create(ipfsJSConfig);

  console.log(`${env.pinner.peerMultiaddr} connecting...`);
  await ipfs.swarm.connect(env.pinner.peerMultiaddr);
  console.log(`${env.pinner.peerMultiaddr} connected!!!`);

  const ipfsStore = new IpfsStore(ipfsCidConfig, ipfs, env.pinner.url);

  const identity = new PolkadotOrbitDBIdentity(pkdConnection);

  const identitySources = [identity];
  const contextAcl = getContextAcl(identitySources);
  const proposalsAcl = getProposalsAcl(identitySources);
  const customStores = [ContextStore, ProposalStore, ProposalsToPerspectiveStore, AddressMapping];

  const orbitDBCustom = new OrbitDBCustom(
    customStores,
    [contextAcl, proposalsAcl],
    identity,
    env.pinner.url,
    env.pinner.peerMultiaddr,
    ipfs
  );
  await orbitDBCustom.ready();

  const proposals = new ProposalsOrbitDB(orbitDBCustom, ipfsStore);

  const pdkEveesConnection = new EveesPolkadotConnection(pkdConnection);
  await pdkEveesConnection.ready();

  const pkdEvees = new EveesBlockchainCached(
    pdkEveesConnection,
    orbitDBCustom,
    ipfsStore,
    proposals
  );

  const councilConfig = {
    // duration: Math.round((5.0 * 60.0 * 60.0 * 24.0) / 5.0),
    duration: Math.round((10.0 * 60.0) / 5.0),
    quorum: 1.0 / 3.0,
    thresehold: 0.5
  };
  const pkdCouncilEvees = new EveesPolkadotCouncil(pkdConnection, ipfsStore, councilConfig);
  await pkdEvees.connect();

  const evees = new EveesModule([pkdEvees, pkdCouncilEvees]);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new CortexModule(),
    new DiscoveryModule([pkdEvees.casID]),
    new LensesModule(),
    new EveesBlockchainModule(),
    new EveesOrbitDBModule(),
    new EveesPolkadotModule(),
    evees,
    documents,
    wikis
  ];

  await orchestrator.loadModules(modules);

  console.log(orchestrator);
  customElements.define('simple-wiki', SimpleWiki);
})();
