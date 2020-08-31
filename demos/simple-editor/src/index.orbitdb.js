import { ethers } from 'ethers';
import IPFS from 'ipfs';

import {
  MicroOrchestrator,
  i18nextBaseModule,
} from '@uprtcl/micro-orchestrator';
import { LensesModule } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';

import { CortexModule } from '@uprtcl/cortex';
import { EveesModule } from '@uprtcl/evees';
import { IpfsStore } from '@uprtcl/ipfs-provider';

import { OrbitDBConnection, EveesOrbitDB } from '@uprtcl/evees-orbitdb';
import { EveesEthereum, EveesEthereumModule } from '@uprtcl/evees-ethereum';

import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import { SimpleEditor } from './simple-editor';
import { SimpleWiki } from './simple-wiki';

(async function () {
  // const provider = '';
  const provider = ethers.getDefaultProvider('rinkeby', {
    etherscan: '6H4I43M46DJ4IJ9KKR8SFF1MF2TMUQTS2F',
    infura: '73e0929fc849451dae4662585aea9a7b',
  });
  // const ethHost = 'ws://localhost:8545';

  const ipfsCidConfig = {
    version: 1,
    type: 'sha2-256',
    codec: 'raw',
    base: 'base58btc',
  };

  const pinnerUrl = 'http://localhost:3000';

  const ipfsJSConfig = {
    preload: { enabled: false },
    relay: { enabled: true, hop: { enabled: true, active: true } },
    EXPERIMENTAL: { pubsub: true },
    config: {
      Addresses: {
        Swarm: [
          '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
          '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
          '/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/',
        ],
      },
      Bootstrap: [
        '/ip4/192.168.1.13/tcp/4002/p2p/QmaYSNkfQkXDkuuX1wj7uWkJUW4ZazSVudZMAzGsRTE1CN',
      ],
    },
  };

  const orchestrator = new MicroOrchestrator();

  const ipfs = await IPFS.create(ipfsJSConfig);

  const config = await ipfs.config.getAll();
  await ipfs.swarm.connect(
    '/ip4/192.168.1.13/tcp/4002/p2p/QmaYSNkfQkXDkuuX1wj7uWkJUW4ZazSVudZMAzGsRTE1CN'
  );

  const peers = await ipfs.swarm.peers();
  console.log({ peers, ipfs });

  const ipfsStore = new IpfsStore(ipfsCidConfig, ipfs);
  await ipfsStore.ready();

  const orbitDBConnection = new OrbitDBConnection(pinnerUrl, ipfsStore, ipfs);
  await orbitDBConnection.ready();

  const ethConnection = new EthereumConnection({ provider });
  await ethConnection.ready();

  const orbitdbEvees = new EveesOrbitDB(
    ethConnection,
    orbitDBConnection,
    ipfsStore,
    orchestrator.container
  );
  await orbitdbEvees.connect();

  const ethEvees = new EveesEthereum(ethConnection, ipfsStore);
  await ethEvees.ready();

  const evees = new EveesModule([ethEvees, orbitdbEvees], orbitdbEvees);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new CortexModule(),
    new DiscoveryModule([orbitdbEvees.casID]),
    new LensesModule(),
    new EveesEthereumModule(),
    evees,
    documents,
    wikis,
  ];

  await orchestrator.loadModules(modules);

  /*** add other services to the container */
  orchestrator.container
    .bind('ethereum-connection')
    .toConstantValue(ethConnection);

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
  customElements.define('simple-wiki', SimpleWiki);
})();
