# @uprtcl/documents

This cortex module implements patterns, services and lenses to interact with document-like objects that are behave as Evees.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/documents
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { IpfsStore } from "@uprtcl/ipfs-provider";
import { DocumentsModule } from "@uprtcl/documents";

const ipfsStore = new IpfsStore({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

const docs = new DocumentsModule([ipfsStore]);
await orchestrator.loadModule(docs);
```

To have update functionality, you also need to install the [EveesModule](https://github.com/uprtcl/js-uprtcl-modules/tree/master/modules/evees).
