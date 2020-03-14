# @uprtcl/access-control

This cortex module implements patterns, services and elements to interact with access control behaviours.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

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
