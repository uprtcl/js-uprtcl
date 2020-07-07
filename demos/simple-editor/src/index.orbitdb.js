import {
  MicroOrchestrator,
  i18nextBaseModule,
} from '@uprtcl/micro-orchestrator';
import { LensesModule } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';

import { CortexModule } from '@uprtcl/cortex';
import { AccessControlModule } from '@uprtcl/access-control';
import { EveesModule, EveesEthereum } from '@uprtcl/evees';
import { IpfsStore } from '@uprtcl/ipfs-provider';

import { OrbitDBConnection, EveesOrbitDB } from '@uprtcl/evees';

import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import { SimpleEditor } from './simple-editor';
import { SimpleWiki } from './simple-wiki';

import IPFS from 'ipfs';

(async function () {
  // const c1host = 'http://localhost:3000/uprtcl/1';
  const c1host = 'https://api.intercreativity.io/uprtcl/1';
  const ethHost = '';
  // const ethHost = 'ws://localhost:8545';

  const ipfsConfig = { host: 'localhost', port: 5001, protocol: 'http' };
  // const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };
  // const ipfsConfig = { host: 'ec2-54-145-41-139.compute-1.amazonaws.com', port: 5001, protocol: 'http' };
  // const ipfsConfig = {
  //   host: 'ipfs.intercreativity.io',
  //   port: 443,
  //   protocol: 'https',
  // };

  const ipfsCidConfig = {
    version: 1,
    type: 'sha2-256',
    codec: 'raw',
    base: 'base58btc',
  };

  const orchestrator = new MicroOrchestrator();

  const ipfsStore = new IpfsStore(ipfsConfig, ipfsCidConfig);
  await ipfsStore.ready();

  const ipfs = await IPFS.create();
  const orbitDBConnection = new OrbitDBConnection(ipfsStore, ipfs, {});
  const ethConnection = new EthereumConnection({ provider: ethHost });

  const httpEvees = new EveesOrbitDB(
    ethConnection,
    orbitDBConnection,
    ipfsStore,
    orchestrator.container
  );

  const ethEvees = new EveesEthereum(
    ethConnection,
    ipfsStore,
    orchestrator.container
  );

  const evees = new EveesModule([ethEvees, httpEvees], httpEvees);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new CortexModule(),
    new DiscoveryModule([httpEvees.casID]),
    new LensesModule(),
    new AccessControlModule(),
    evees,
    documents,
    wikis,
  ];

  await orchestrator.loadModules(modules);

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
  customElements.define('simple-wiki', SimpleWiki);
})();
