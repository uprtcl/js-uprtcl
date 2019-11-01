# @uprtcl/common

>_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)
/)

This is a collection of common Cortex modules, developed as the starting point of many applications:

- **\_Prtcl module**: generic version control, allowing different perspectives of any content-addressable content to diverge and merge, and allowing anyone to make proposals to update any content they see
- Access Control: generic access control
- Draft: generic providers to store drafts for any kind of content

## Dependencies

This module depends on `@uprtcl/micro-orchestrator`, `@uprtcl/cortex` and `@uprtcl/connections`.

## Install

```bash
npm install @uprtcl/common
```

## \_Prtcl module usage

Example

```ts
import { uprtclModule, UprtclEthereum, UprtclHolochain } from '@uprtcl/common';

const uprtclHolochain = new UprtclHolochain({
  host: 'ws://localhost:8888',
  instance: 'test-instance'
});

const uprtclEth = new UprtclEthereum('ws://localhost:8545', {
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const knownSources = new KnownSourcesHolochain({
  host: 'ws://localhost:8888',
  instance: 'test-instance'
});

const discoverableUprtclHolo = { service: uprtclHolochain, knownSources: knownSources };

const discoverableUprtclEth = { service: uprtclEth, knownSources: knownSources };

const uprtcl = uprtclModule([discoverableUprtclHolo, discoverableUprtclEth]);
await orchestrator.loadModules(uprtcl);
```

## Drafts and access control

> Not yet ready
