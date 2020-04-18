import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { LensesModule, LensSelectorPlugin, ActionsPlugin } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';

import { CortexModule } from '@uprtcl/cortex';
import { AccessControlModule } from '@uprtcl/access-control';
import { EveesModule, EveesEthereum, EveesHttp } from '@uprtcl/evees';

import { IpfsConnection, IpfsStore } from '@uprtcl/ipfs-provider';
import { HttpConnection, HttpStore } from '@uprtcl/http-provider';

import { EthereumConnection } from '@uprtcl/ethereum-provider';

import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import { SimpleEditor } from './simple-editor';
import { SimpleWiki } from './simple-wiki';
  

(async function() {
  // const c1host = 'http://3.12.79.127:3100/uprtcl/1';
  const c1host = 'http://localhost:3100/uprtcl/1';
  const ethHost = '';
  // const ethHost = 'ws://localhost:8545';
  const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };

  const httpCidConfig = { version: 1, type: 'sha3-256', codec: 'raw', base: 'base58btc' };
  const ipfsCidConfig = { version: 1, type: 'sha2-256', codec: 'raw', base: 'base58btc' };

  const httpConnection = new HttpConnection();
  const ipfsConnection = new IpfsConnection(ipfsConfig);
  const ethConnection = new EthereumConnection({ provider: ethHost });

  const httpEvees = new EveesHttp(c1host, httpConnection, ethConnection, httpCidConfig);
  const ethEvees = new EveesEthereum(ethConnection, ipfsConnection, ipfsCidConfig);

  const ipfsStore = new IpfsStore(ipfsConnection, ipfsCidConfig);
  const httpStore = new HttpStore(c1host, httpConnection, httpCidConfig);

  const remoteMap = (eveesAuthority) => {
    if (eveesAuthority === ethEvees.authority) {
      return ipfsStore;
    } else {
      return httpStore;
    }
  };
  const remotesConfig = {
    map: remoteMap,
    defaultCreator: httpEvees
  }

  const evees = new EveesModule([ethEvees, httpEvees], remotesConfig);

  const documents = new DocumentsModule([ipfsStore, httpStore]);
  // const documentsFields = new DocumentsFieldsModule([ipfsStore, httpStore]);

  const wikis = new WikisModule([ipfsStore, httpStore]);

  const lenses = new LensesModule({
    'lens-selector': new LensSelectorPlugin(),
    actions: new ActionsPlugin()
  });

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new CortexModule(),
    new DiscoveryModule(),
    lenses,
    new AccessControlModule(),
    evees,
    documents,
    wikis
  ];

  const orchestrator = new MicroOrchestrator();

  await orchestrator.loadModules(modules);

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
  customElements.define('simple-wiki', SimpleWiki);
})();
