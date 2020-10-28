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

import { EveesOrbitDB, EveesOrbitDBModule } from '@uprtcl/evees-orbitdb';
import { EthereumOrbitDBIdentity } from '@uprtcl/evees-ethereum';
import { OrbitDBCustom } from '@uprtcl/orbitdb-provider';

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
  const provider = '';
  // const provider = ethers.getDefaultProvider('rinkeby', env.ethers.apiKeys);
  // const provider = 'https://rpc.xdaichain.com/';

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

  const ipfs = await IPFS.create(ipfsJSConfig);

  console.log('connecting to pinner peer');
  await ipfs.swarm.connect(env.pinner.peerMultiaddr);
  console.log('connected!!!');

  const ipfsStore = new IpfsStore(ipfsCidConfig, ipfs, env.pinner.url);
  await ipfsStore.ready();

  const ethConnection = new EthereumConnection({ provider });
  await ethConnection.ready();
  const identity = new EthereumOrbitDBIdentity(ethConnection);

  const orbitDBCustom = new OrbitDBCustom(
    [PerspectiveStore, ContextStore, ProposalStore, ProposalsToPerspectiveStore],
    [ContextAccessController, ProposalsAccessController],
    identity,
    env.pinner.url,
    env.pinner.peerMultiaddr,
    ipfs
  );
  await orbitDBCustom.ready();

  const orbitdbEveesMaster = new EveesOrbitDB(orbitDBCustom, ipfsStore, 'master');
  await orbitdbEveesMaster.connect();

  const orbitdbEvees = new EveesOrbitDB(orbitDBCustom, ipfsStore);
  await orbitdbEvees.connect();

  const evees = new EveesModule([orbitdbEveesMaster, orbitdbEvees]);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new CortexModule(),
    new DiscoveryModule([orbitdbEvees.casID]),
    new LensesModule(),
    new EveesOrbitDBModule(),
    evees,
    documents,
    wikis
  ];

  await orchestrator.loadModules(modules);

  console.log(orchestrator);
  customElements.define('simple-wiki', SimpleWiki);
})();
