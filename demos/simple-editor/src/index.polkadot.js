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
  const polkadotWs = '';

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

  const pkdConnection = new PolkadotConnection(polkadotWs);
  await pkdConnection.ready();

  const ipfs = await IPFS.create(ipfsJSConfig);

  console.log('connecting to pinner peer');
  await ipfs.swarm.connect(env.pinner.peerMultiaddr);
  console.log('connected!!!');

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
  const pkdCouncilEvees = new EveesPolkadotCouncil(pkdConnection, ipfsStore);
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
