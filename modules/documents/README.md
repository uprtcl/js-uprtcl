# @uprtcl/documents

This cortex module implements patterns, services and lenses to interact with document-like objects.

> Note: this module is best used with `@uprtcl/common` and using the uprtcl module to handle updating the documents.

## Install

```bash
npm install @uprtcl/documents
```

## Usage

```ts
import { documentsModule, DocumentsIpfs } from '@uprtcl/documents';

const documentsProvider = new DocumentsIpfs({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const docs = documentsModule([documentsProvider]);
await orchestrator.loadModules(docs);
```
