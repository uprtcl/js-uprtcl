# @uprtcl/access-control

This cortex module implements patterns, services and elements to interact with access control behaviours.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/documents
```

## Usage

This module is mainly used as a dependency for `@uprtcl/evees`.
Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { AccessControlModule} from '@uprtcl/access-control';

const accessControl = new AccessControlModule();

await orchestrator.loadModules([accessControl]);
```
