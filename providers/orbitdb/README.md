# @uprtcl/ipfs-provider

This node package includes basic _Prtcl provider wrappers around ipfs-http-client. These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/ipfs-provider
```

## Usage

Import the appropriate connection you would like to use, and make a new instance of it by passing its configuration:

```ts
import { IpfsStore } from '@uprtcl/ipfs-provider';

const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };
const ipfsStore = new IpfsStore(ipfsConfig);

await ipfsStore.ready();
```
