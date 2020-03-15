# @uprtcl/holochain-provider

This node package includes basic _Prtcl provider wrappers around @holochain/hc-web-client. These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/holochain-provider
```

## Usage

Import the appropriate connection you would like to use, and make a new instance of it by passing its configuration:

```ts
import {MicroOrchestrator} from '@uprtcl/micro-orchestrator';
import { HolochainConnectionModule, HolochainConnection } from '@uprtcl/holochain-provider';

const hcConnection = new HolochainConnection({
  host: 'localhost:8888'
});

const hcModule = new HolochainConnectionModule(hcConnection);

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModule(hcModule);
```
