import { EveesHttp } from '@uprtcl/evees';

import { HttpConnection, HttpStore } from '@uprtcl/http-provider';

import {
  MicroOrchestrator,
  i18nextBaseModule,
} from '@uprtcl/micro-orchestrator';
import { LensesModule } from '@uprtcl/lenses';
import { DocumentsModule } from '@uprtcl/documents';
import { WikisModule } from '@uprtcl/wikis';
import { EveesModule } from '@uprtcl/evees';
import { CortexModule } from '@uprtcl/cortex';
import { AccessControlModule } from '@uprtcl/access-control';
import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';

export const EveesEthereumBinding = 'evees-ethereum';

export const initUprtcl = async () => {
  // const c1host = 'https://api.intercreativity.io/uprtcl/1';
  const c1host = 'http://localhost:3100/uprtcl/1';

  const ethHost = '';

  const ipfsConfig = {
    host: 'ipfs.intercreativity.io',
    port: 443,
    protocol: 'https',
  };

  const httpCidConfig: any = {
    version: 1,
    type: 'sha3-256',
    codec: 'raw',
    base: 'base58btc',
  };

  const orchestrator = new MicroOrchestrator();

  const httpConnection = new HttpConnection();
  const httpStore = new HttpStore(c1host, httpConnection, httpCidConfig);

  const auth0 = undefined;

  const httpEvees = new EveesHttp(c1host, httpConnection, auth0, httpStore);

  const evees = new EveesModule([httpEvees], httpEvees);

  const documents = new DocumentsModule();
  const wikis = new WikisModule();

  try {
    await orchestrator.loadModules([
      new i18nextBaseModule(),
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule([httpEvees.casID]),
      new LensesModule(),
      new AccessControlModule(),
      evees,
      documents,
      wikis,
    ]);
  } catch (e) {
    console.error('error loading modules', e);
  }
};
