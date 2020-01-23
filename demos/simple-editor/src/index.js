import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { LensesModule, LensSelectorPlugin, ActionsPlugin } from '@uprtcl/lenses';
import { DocumentsHttp, DocumentsIpfs, DocumentsModule } from '@uprtcl/documents';
import { WikisIpfs, WikisModule, WikisHttp } from '@uprtcl/wikis';
import { GqlCortexModule } from '@uprtcl/common';
import { AccessControlModule } from '@uprtcl/access-control';
import { EveesModule, EveesEthereum, EveesHttp } from '@uprtcl/evees';
import { IpfsConnection, EthereumConnection, HttpConnection } from '@uprtcl/connections';
import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import { SimpleEditor } from './simple-editor';
import { SimpleWiki } from './simple-wiki';

(async function() {
  const c1host = 'http://localhost:3100/uprtcl/1';
  const ethHost = 'ws://localhost:8545';
  const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };

  const httpConnection = new HttpConnection();
  const ipfsConnection = new IpfsConnection(ipfsConfig);
  const ethConnection = new EthereumConnection({ provider: ethHost });

  const httpEvees = new EveesHttp(c1host, httpConnection);
  const ethEvees = new EveesEthereum(ethConnection, ipfsConnection);

  const httpDocuments = new DocumentsHttp(c1host, httpConnection);
  const ipfsDocuments = new DocumentsIpfs(ipfsConnection);

  const httpWikis = new WikisHttp(c1host, httpConnection);
  const ipfsWikis = new WikisIpfs(ipfsConnection);

  const remoteMap = (eveesAuthority, entityName) => {
    if (eveesAuthority === ethEvees.authority) {
      if (entityName === 'Wiki') return ipfsWikis;
      else if (entityName === 'TextNode') return ipfsDocuments;
    } else {
      if (entityName === 'Wiki') return httpWikis;
      else if (entityName === 'TextNode') return httpDocuments;
    }
  };

  const evees = new EveesModule([ethEvees, httpEvees], remoteMap);

  const documents = new DocumentsModule([ipfsDocuments, httpDocuments]);

  const wikis = new WikisModule([ipfsWikis, httpWikis]);

  const lenses = new LensesModule({
    'lens-selector': new LensSelectorPlugin(),
    actions: new ActionsPlugin()
  });

  const modules = [
    new i18nextBaseModule(),
    new ApolloClientModule(),
    new GqlCortexModule(),
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
