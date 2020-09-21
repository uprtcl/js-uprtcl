import { ethers } from 'ethers';
import IPFS from 'ipfs';
import { env } from '../env';

import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { LensesModule } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';

import { CortexModule } from '@uprtcl/cortex';
import { EveesModule } from '@uprtcl/evees';
import { IpfsStore } from '@uprtcl/ipfs-provider';

import {
  OrbitDBCustom,
  EveesOrbitDB,
  EveesOrbitDBModule,
  ProposalsOrbitDB,
  EthereumIdentity
} from '@uprtcl/evees-orbitdb';
import { EveesEthereum, EveesEthereumModule } from '@uprtcl/evees-ethereum';

import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import {
  PerspectiveStore,
  ContextStore,
  ProposalStore,
  ProposalsToPerspectiveStore,
  ContextAccessController,
  ProposalsAccessController
} from '@uprtcl/evees-orbitdb';

import { SimpleWiki } from './simple-wiki';

(async function() {
  // const provider = '';
  const provider = ethers.getDefaultProvider('rinkeby', env.ethers.apiKeys);
  // const ethHost = 'ws://localhost:8545';

  const ipfsCidConfig = {
    version: 1,
    type: 'sha2-256',
    codec: 'raw',
    base: 'base58btc'
  };

  const pinnerUrl = env.pinner.url;

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

  const ipfs = await IPFS.create(ipfsJSConfig);

  const ipfsStore = new IpfsStore(ipfsCidConfig, ipfs, pinnerUrl);
  await ipfsStore.ready();

  const ethConnection = new EthereumConnection({ provider });
  await ethConnection.ready();
  const identity = new EthereumIdentity(ethConnection);

  const orbitDBCustom = new OrbitDBCustom(
    [PerspectiveStore, ContextStore, ProposalStore, ProposalsToPerspectiveStore],
    [ContextAccessController, ProposalsAccessController],
    identity,
    pinnerUrl,
    ipfs
  );
  await orbitDBCustom.ready();

  const orbitdbEvees = new EveesOrbitDB(orbitDBCustom, ipfsStore);
  await orbitdbEvees.connect();

  const proposals = new ProposalsOrbitDB(orbitDBCustom, ipfsStore);
  const ethEvees = new EveesEthereum(ethConnection, ipfsStore, proposals);
  await ethEvees.ready();

  const eveesConfig = {
    defaultRemote: orbitdbEvees,
    emitIf: {
      remote: ethEvees.id,
      owner: '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0'.toLocaleLowerCase()
    }
  };
  const evees = new EveesModule([ethEvees, orbitdbEvees], eveesConfig);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new CortexModule(),
    new DiscoveryModule([orbitdbEvees.casID]),
    new LensesModule(),
    new EveesEthereumModule(),
    new EveesOrbitDBModule(),
    evees,
    documents,
    wikis
  ];

  await orchestrator.loadModules(modules);

  /*** add other services to the container */
  orchestrator.container.bind('official-connection').toConstantValue(ethConnection);

  console.log(orchestrator);
  customElements.define('simple-wiki', SimpleWiki);
})();
