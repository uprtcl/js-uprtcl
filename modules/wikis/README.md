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
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { WikisModule, WikisTypes } from '@uprtcl/wikis';

const ipfsStore = new IpfsStore({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const wikis = new WikisModule([ ipfsStore ]);
await orchestrator.loadModule(wikis);
```
