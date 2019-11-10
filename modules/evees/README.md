# @uprtcl/evees

> \_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

Cortex module to deal with generic version control for any kind of content-addressable objects to become [**Evees**](https://github.com/uprtcl/spec/wiki/What-are-Evees%3F). This package can be used to handle updates to content-addressable content with different perspectives on the content (similar to branches in Git) and built-in proposal management.

> This repository contains the current javascript implementation of all the \_Prtcl services, modules and pattern to deal with **Evees** (Evolving Entities).

## Dependencies

This package depends on `@uprtcl/micro-orchestrator`, `@uprtcl/connections`, `@uprtcl/common` and `@uprtcl/cortex`.

## Install

```bash
npm install @uprtcl/evees
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { eveesModule, UprtclEthereum } from '@uprtcl/evees';

const eveesProvider = new UprtclEthereum('ws://localhost:8545', {
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const evees = eveesModule([{ service: eveesProvider }]);
await orchestrator.loadModules(evees);
```
