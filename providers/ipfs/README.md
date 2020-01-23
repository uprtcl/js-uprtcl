# @uprtcl/ipfs-provider

>_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This node package includes basic _Prtcl provider wrappers around ipfs-http-client. These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

## Install

```bash
npm install @uprtcl/ipfs-provider
```

## Usage

Import the appropriate connection you would like to use, and make a new instance of it by passing its configuration:

```ts
import { IpfsConnection } from '@uprtcl/ipfs-provider';

const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };
const ipfsConnection = new IpfsConnection(ipfsConfig);

await ipfsConnection.ready();
```
