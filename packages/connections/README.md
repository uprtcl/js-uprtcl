# @uprtcl/connections

This node package includes basic connections services to help connect to different backend platforms. These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

List of supported connections:

- **Ethereum**: small wrapper around `Web3`
- **Ipfs**: small wrapper around `ipfs-http-client`
- **Holochain**: small wrapper around `@holochain/hc-web-client`
- **Web server** (via http or websockets)

## Dependencies

This package depends on `@uprtcl/micro-orchestrator` and `@uprtcl/cortex` to import basic types, but doesn't import funcionality from them.

## Install

```bash
npm install @uprtcl/connections
```

## Usage

Import the appropriate connection you would like to use, and make a new instance of it by passing its configuration:

```ts
import { EthereumConnection } from '@uprtcl/connections';

const ethConnection = new EthereumConnection({
  provider: provider,
  contractAbi: myContractAbi
});

await ethConnection.ready();
```
