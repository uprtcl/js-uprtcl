# @uprtcl/wikis

This cortex module implements patterns, services and lenses to interact with wiki-like objects.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

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
