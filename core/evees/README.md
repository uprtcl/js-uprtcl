# @uprtcl/evees

Cortex module to deal with generic version control for any kind of content-addressable objects to become [**Evees**](https://github.com/uprtcl/spec/wiki/What-are-Evees%3F). This package can be used to handle updates to content-addressable content with different perspectives on the content (similar to branches in Git) and built-in proposal management.

> This repository contains the current javascript implementation of all the \_Prtcl services, modules and pattern to deal with **Evees** (Evolving Entities).

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/evees
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { HttpConnection } from '@uprtcl/http-provider';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { EveesModule, EveesEthereum, EveesHttp } from '@uprtcl/evees';

const ipfsConfig = { host: 'ipfs.infura.io', port: 5001, protocol: 'https' };

const cidConfig = { version: 1, type: 'sha2-256', codec: 'raw', base: 'base58btc' };

// Don't put anything on host to get from Metamask's ethereum provider
const ethConnection = new EthereumConnection({});

const eveesEth = new EveesEthereum(ethConnection, ipfsConfig, cidConfig);

const httpConnection = new HttpConnection();

const httpEvees = new EveesHttp('http://localhost:3100/uprtcl/1', httpConnection, ethConnection, cidConfig);

const evees = new EveesModule([httpEvees, eveesEth], httpEvees);

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModule(evees);
```
