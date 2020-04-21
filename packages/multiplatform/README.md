# @uprtcl/multiplatform

[![](https://img.shields.io/npm/v/@uprtcl/multiplatform)](https://www.npmjs.com/package/@uprtcl/multiplatform)

This package contains services, modules and GraphQl directives that help resolve generic content-addressable linking between entities. It also helps traverse entity links accross platforms.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/multiplatform
```

## Usage

Import the `DiscoveryModule` and load it in the `micro-orchestrator`.

```ts
import { DiscoveryModule } from '@uprtcl/multiplatform';

await orchestrator.loadModule(new DiscoveryModule());
```

Now you can add multiple `CASModules` to register new *Content-Addressable Sources and Stores* into your application. This will make all content-addressable object retrievable through that source integrated into the application, and they can automatically be referenced by any other entity to fetch and resolve them.

```ts
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CASModule } from '@uprtcl/multiplatform';
import { IpfsConnection, IpfsSource } from '@uprtcl/ipfs-provider';

const ipfsConnection = new IpfsConnection(ipfsConfig);
const ipfsSource = new IpfsSource(ipfsConnection);

export class TestModule extends MicroModule {
  static id = Symbol('test-module');

  get submodules() {
    return [new CASModule([ipfsSource])];
  }
}
```

Add that module to the `micro-orchestrator`:

```ts
import { TestModule } from './test-module';

await orchestrator.loadModule(new TestModule());
```

