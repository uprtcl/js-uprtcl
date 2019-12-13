# @uprtcl/documents

>_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This cortex module implements patterns, services and lenses to interact with document-like objects.

> Note: this module is best used with `@uprtcl/evees` and using the evees module to handle updating the documents.

## Dependencies

This module depends on `@uprtcl/micro-orchestrator`, `@uprtcl/cortex` and `@uprtcl/connections`. It also depends on a redux module to be present.

## Install

```bash
npm install @uprtcl/documents
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { documentsModule, DocumentsIpfs, DocumentsTypes } from '@uprtcl/documents';

const documentsProvider = new DocumentsIpfs({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const docs = documentsModule([{ service: documentsProvider }]);
await orchestrator.loadModules({
  id: DocumentsTypes.Module,
  module: docs
});
```
