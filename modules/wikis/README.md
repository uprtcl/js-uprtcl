# @uprtcl/wikis

> \_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This cortex module implements patterns, services and lenses to interact with wiki-like objects.

## Install

```bash
npm install @uprtcl/wikis
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { WikisModule, WikisIpfs, WikisBindings } from '@uprtcl/wikis';
import { IpfsConnection } from '@uprtcl/ipfs-provider';

const ipfsConnection = new IpfsConnection({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const wikisProvider = new WikisIpfs(ipfsConnection);

const wikis = new WikisModule([wikisProvider]);

await orchestrator.loadModule(wikis);
```
