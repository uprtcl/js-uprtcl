# @uprtcl/documents

> \_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This cortex module implements patterns, services and lenses to interact with document-like objects.

## Install

```bash
npm install @uprtcl/documents
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { DocumentsModule, DocumentsIpfs, DocumentsBindings } from '@uprtcl/documents';

const documentsProvider = new DocumentsIpfs({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const docs = new DocumentsModule([documentsProvider]);
await orchestrator.loadModule(docs);
```
