# @uprtcl/evees

> \_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

Cortex module to deal with generic version control for any kind of content-addressable objects to become [**Evees**](https://github.com/uprtcl/spec/wiki/What-are-Evees%3F). This package can be used to handle updates to content-addressable content with different perspectives on the content (similar to branches in Git) and built-in proposal management.

> This repository contains the current javascript implementation of all the \_Prtcl services, modules and pattern to deal with **Evees** (Evolving Entities).

## Install

```bash
npm install @uprtcl/evees
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { IpfsConnection } from '@uprtcl/ipfs-provider';
import { HolochainConnection } from '@uprtcl/holochain-provider';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { EveesModule, EveesEthereum, EveesHolochain, EveesBindings } from '@uprtcl/evees';

const ipfsConnection = new IpfsConnection({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

// Don't put anything on host to get from Metamask's ethereum provider
const ethConnection = new EthereumConnection({});

const eveesEth = new EveesEthereum(ethConnection, ipfsConnection);

const hcConnection = new HolochainConnection({ host: 'ws://localhost:8888' });

const eveesHolochain = new EveesHolochain('test-instance', hcConnection);

const evees = new EveesModule([eveesHolochain, eveesEth]);

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModule(evees);
```
