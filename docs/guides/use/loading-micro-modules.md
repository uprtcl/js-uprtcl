# Loading MicroModules

## About MicroModules

`MicroModules` are a flexible and composable way of **adding a slice of functionality** to your web application. One of their main functions is to **register dependencies globally** within two main registries:

- The [InversifyJS](https://github.com/inversify/InversifyJS) container inside the `micro-orchestrator`
- The [customElements](https://developers.google.com/web/fundamentals/web-components/customelements) registry present in the browser

### Dependencies

One of the main features of `MicroModules` is that they can declare dependencies and submodules. This is to make sure that multiple modules can depend on the same base one, without loading the base module every time that we include a dependant module.

This means that we should be careful when importing and using them. **If we try to load a module without having already loaded its dependencies, the module loading will fail**. This applies to all submodules as well: any dependency specified by a submodule must be present in the application for the module to load.

### Functionality

Each `MicroModule` **functionally acts as a coherent unit** composed of different parts that can work together to cover certain functionality, often dealing with a common domain of data.

For example, some modules **could register GraphQl schema parts** that query documents and some **backend provider** for those documents, and also **custom elements that query documents** data and are able to display it.

## Installing and loading `MicroModules`

Every `MicroModule` will have different configuration processes, dependencies or requirements. In general terms, we can follow this process:

0. Choose which `MicroModules` you want to install in your app.

1. Install the required npm package for your module:

```bash
npm install @uprtcl/documents
```

2. Import and configure the `MicroModule`:

```ts
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { DocumentsModule, DocumentsIpfs } from '@uprtcl/documents';

const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };

const ipfsStore = new IpfsStore(ipfsConfig);

const docs = new DocumentsModule([ipfsStore]);
```

3. Make sure that all dependency modules for your module are already configured and loaded:

```ts
import { ApolloClientModule } from '@uprtcl/graphql';
import { i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { DiscoveryModule } from '@uprtcl/multiplatform';
import { CortexModule } from '@uprtcl/cortex';
import { LensesModule } from '@uprtcl/lenses';
import { EveesModule, EveesHttp, EveesEthereum } from '@uprtcl/evees';
  
const ipfsCidConfig = { version: 1, type: 'sha2-256', codec: 'raw', base: 'base58btc' };

const ethConnection = new EthereumConnection({ provider: '' });
const ethEvees = new EveesEthereum(ethConnection, ipfsConfig, ipfsCidConfig);

await orchestrator.loadModules([
  new ApolloClientModule(),
  new i18nextBaseModule(),
  new DiscoveryModule(),
  new CortexModule(),
  new LensesModule(),
  new EveesModule([ethEvees, httpEvees], ethEvees)
]);
```

Normally these base modules are only loaded once, but used by a lot of different modules.

4. Load the module in the `MicroOrchestrator`:

```ts
await orchestrator.loadModule(docs);
```
