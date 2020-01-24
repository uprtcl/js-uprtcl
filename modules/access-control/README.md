# @uprtcl/access-control

>_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This cortex module implements patterns, services and elements to interact with access control behaviours.

## Dependencies

This module depends on `@uprtcl/micro-orchestrator`, `@uprtcl/cortex`.

## Install

```bash
npm install @uprtcl/documents
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { documentsModule, DocumentsIpfs, DocumentsBindings} from '@uprtcl/documents';

const documentsProvider = new DocumentsIpfs({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const docs = documentsModule([{ service: documentsProvider }]);
await orchestrator.loadModules({
  id: DocumentsBindings.Module,
  module: docs
});
```
