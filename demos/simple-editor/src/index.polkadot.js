import IPFS from 'ipfs';

import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { LensesModule } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';

import { CortexModule } from '@uprtcl/cortex';
import { EveesModule } from '@uprtcl/evees';
import {
  EveesPolkadotIdentity,
  EveesPolkadotCouncil,
  PolkadotIdentity,
  PolkadotConnection,
  PolkadotContextStore,
  PolkadotContextAccessController
} from '@uprtcl/evees-polkadot';
import {
  ProposalsOrbitDB,
  ProposalStore,
  ProposalsToPerspectiveStore,
  ProposalsAccessController
} from '@uprtcl/evees-orbitdb';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import {} from '@uprtcl/evees-orbitdb';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';

import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import { SimpleWiki } from './simple-wiki';

import { env } from '../env';

(async function() {
  const pinnerUrl = '';
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
  const ipfsStore = new IpfsStore(ipfsCidConfig, ipfs);

  const identity = new PolkadotIdentity(pkdConnection);

  const orbitDBCustom = new OrbitDBCustom(
    [PolkadotContextStore, ProposalStore, ProposalsToPerspectiveStore],
    [PolkadotContextAccessController, ProposalsAccessController],
    identity,
    pinnerUrl,
    ipfs
  );
  await orbitDBCustom.ready();

  const proposals = new ProposalsOrbitDB(orbitDBCustom, ipfsStore);
  const pkdEvees = new EveesPolkadotIdentity(pkdConnection, orbitDBCustom, ipfsStore, proposals);
  const pkdCouncilEvees = new EveesPolkadotCouncil(pkdConnection, ipfsStore);
  await pkdEvees.connect();

  // TODO: had to restore this or it wouldn't work. figure out why 2nd arg was removed
  const evees = new EveesModule([pkdEvees, pkdCouncilEvees]);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new CortexModule(),
    new DiscoveryModule([pkdEvees.casID]),
    new LensesModule(),
    evees,
    documents,
    wikis
  ];

  await orchestrator.loadModules(modules);

  orchestrator.container.bind('official-connection').toConstantValue(pkdConnection);

  console.log(orchestrator);
  customElements.define('simple-wiki', SimpleWiki);
})();
