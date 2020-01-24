# @uprtcl/holochain-provider

>_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This node package includes basic _Prtcl provider wrappers around @holochain/hc-web-client. These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

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
