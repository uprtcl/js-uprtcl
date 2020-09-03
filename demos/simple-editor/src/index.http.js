import { ethers } from 'ethers';

import {
  MicroOrchestrator,
  i18nextBaseModule,
} from '@uprtcl/micro-orchestrator';
import { LensesModule } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';

import { CortexModule } from '@uprtcl/cortex';
import { EveesModule } from '@uprtcl/evees';
import { EveesEthereum } from '@uprtcl/evees-ethereum';
import { EveesHttp } from '@uprtcl/evees-http';
import { IpfsStore } from '@uprtcl/ipfs-provider';

import { HttpStore, HttpEthAuthProvider } from '@uprtcl/http-provider';

import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import { SimpleEditor } from './simple-editor';
import { SimpleWiki } from './simple-wiki';

(async function () {
  const provider = ethers.getDefaultProvider('rinkeby', {
    etherscan: '6H4I43M46DJ4IJ9KKR8SFF1MF2TMUQTS2F',
    infura: '73e0929fc849451dae4662585aea9a7b',
  });

  const c1host = 'http://localhost:3100/uprtcl/1';

  const httpCidConfig = {
    version: 1,
    type: 'sha3-256',
    codec: 'raw',
    base: 'base58btc',
  };
  const ipfsCidConfig = {
    version: 1,
    type: 'sha2-256',
    codec: 'raw',
    base: 'base58btc',
  };
  const ipfsJSConfig = {
    preload: { enabled: false },
    relay: { enabled: true, hop: { enabled: true, active: true } },
    EXPERIMENTAL: { pubsub: true },
    config: {
      init: true,
      Addresses: {
        Swarm: env.pinner.Swarm,
      },
      Bootstrap: env.pinner.Bootstrap,
    },
  };

  const orchestrator = new MicroOrchestrator();

  const ethConnection = new EthereumConnection({ provider });
  await ethConnection.ready();

  const httpProvider = new HttpEthAuthProvider(
    { host: c1host, apiId: 'evees-v1' },
    ethConnection
  );
  const httpStore = new HttpStore(httpProvider, httpCidConfig);
  const httpEvees = new EveesHttp(httpProvider, httpStore);
  
  const ipfs = await IPFS.create(ipfsJSConfig);
  const ipfsStore = new IpfsStore(ipfsCidConfig, ipfs);
  const ethEvees = new EveesEthereum(ethConnection, ipfsStore);
  await httpEvees.connect();

  const evees = new EveesModule([ethEvees, httpEvees], httpEvees);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new CortexModule(),
    new DiscoveryModule([httpEvees.casID]),
    new LensesModule(),
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
