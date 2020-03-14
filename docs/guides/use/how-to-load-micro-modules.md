# How to load micro-modules

## MicroModules

`MicroModules` are a flexible and composable way of **registering dependencies globally** within two main registries:

- The container inside the `micro-orchestrator`
- The `customElements` registry present in the browser

[`MicroModules`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/micro-orchestrator/src/orchestrator/micro.module.ts) have these properties:

- `id`: a unique identifier, which means that there should be only one instance of that module in the application.
- `bindings`: identify all the bindings that this module has registered to the `micro-orchestrator` container during initialization.
- `dependencies`: identifier of all the modules that this module depends on. They need to be present when the module is loaded.
- `submodules`: all the modules that compose this bigger module. They will be loaded just before the present module is.

This means that we should be careful when importing and using `MicroModules`. **If we try to load a module without having already loaded its dependencies, the module loading will fail**. This is to make sure that more than one module can depend on the same base one, without loading the base module every time that we include a dependant module.

Each `MicroModule` **functionally acts as a coherent unit** composed of different parts that can work together to cover certain functionality, often dealing with a common domain of data.

For example, some modules **could register GraphQl schema parts** that query documents and some **backend provider** for those documents, and also **custom elements that query documents** data and are able to display it.

## Install and load `MicroModules`

Every `MicroModule` will have different configuration processes, dependencies or requirements. In general terms, we can follow this process:

1. Install the required npm package:

```bash
npm install @uprtcl/documents
```

2. Import and configure the `MicroModule`:

```ts
import { DocumentsModule, DocumentsIpfs } from '@uprtcl/documents';

const documentsProvider = new DocumentsIpfs({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const docs = new DocumentsModule([documentsProvider]);
```

3. Make sure that all dependency modules are already loaded:

```ts
import { ApolloClientModule } from '@uprtcl/graphql';
import { i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { DiscoveryModule } from '@uprtcl/multiplatform';
import { CortexModule } from '@uprtcl/cortex';

await orchestrator.loadModules([
  new ApolloClientModule(),
  new i18nextBaseModule(),
  new DiscoveryModule(),
  new CortexModule()
]);
```

Normally these base modules are only loaded once, but used by a lot of different modules.

4. Load the module in the `MicroOrchestrator`:

```ts
await orchestrator.loadModule(docs);
```
