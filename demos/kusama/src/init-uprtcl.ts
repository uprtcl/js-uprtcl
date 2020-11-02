import IPFS from 'ipfs';

import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { LensesModule } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';
import { EveesModule } from '@uprtcl/evees';
import { CortexModule } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CidConfig, DiscoveryModule } from '@uprtcl/multiplatform';
import {
  PolkadotOrbitDBIdentity,
  PolkadotConnection,
  EveesPolkadotConnection,
  EveesPolkadotCouncil,
  EveesPolkadotModule
} from '@uprtcl/evees-polkadot';
import {
  ProposalsOrbitDB,
  ProposalStore,
  ProposalsToPerspectiveStore,
  ContextStore,
  getProposalsAcl,
  getContextAcl,
  EveesOrbitDBModule
} from '@uprtcl/evees-orbitdb';
import { EveesBlockchainCached, EveesBlockchainModule } from '@uprtcl/evees-blockchain';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';

import { env } from './env';
import { getConnectionDetails } from './connections';

export const initUprtcl = async () => {
  const polkadotWs = '';

  const ipfsCidConfig: CidConfig = {
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

  const connections = getConnectionDetails();
  const pkdConnection = new PolkadotConnection(connections.connections, connections.current);
  await pkdConnection.ready();

  const ipfs = await IPFS.create(ipfsJSConfig);

  console.log(`${env.pinner.peerMultiaddr} connecting...`);
  await ipfs.swarm.connect(env.pinner.peerMultiaddr);
  console.log(`${env.pinner.peerMultiaddr} connected!`);

  const ipfsStore = new IpfsStore(ipfsCidConfig, ipfs, env.pinner.url);
  await ipfsStore.ready();

  const identity = new PolkadotOrbitDBIdentity(pkdConnection);

  const orbitDBCustom = new OrbitDBCustom(
    [ContextStore, ProposalStore, ProposalsToPerspectiveStore],
    [getContextAcl([identity]), getProposalsAcl([identity])],
    identity,
    env.pinner.url,
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
  const pkdCouncilEvees = new EveesPolkadotCouncil(pkdConnection, ipfsStore);
  await pkdEvees.connect();

  const evees = new EveesModule([pkdEvees, pkdCouncilEvees]);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  try {
    await orchestrator.loadModules([
      new i18nextBaseModule(),
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule([pkdEvees.id]),
      new LensesModule(),
      new EveesBlockchainModule(),
      new EveesOrbitDBModule(),
      new EveesPolkadotModule(),
      evees,
      documents,
      wikis
    ]);
  } catch (e) {
    console.error('error loading modules', e);
  }
};
