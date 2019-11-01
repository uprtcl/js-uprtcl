# @uprtcl/documents

>_Prtcl resources: [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This cortex module implements patterns, services and lenses to interact with document-like objects.

> Note: this module is best used with `@uprtcl/common` and using the uprtcl module to handle updating the documents.

## Dependencies

This module depends on `@uprtcl/micro-orchestrator`, `@uprtcl/cortex` and `@uprtcl/connections`.

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
