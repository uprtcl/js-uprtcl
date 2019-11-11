# @uprtcl/common

> \_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)
> /)

This is a collection of common Cortex modules, developed as the starting point of many applications:

- Entities reducer: redux module to hold any kind of content addressable object
- Access Control: generic access control
- Draft: generic providers to store drafts for any kind of content
- **Common patterns** for entities that are hashed, signed...

## Dependencies

This module depends on `@uprtcl/micro-orchestrator`, `@uprtcl/cortex` and `@uprtcl/connections`.

## Install

```bash
npm install @uprtcl/common
```

## \_Prtcl module usage

Import the modules, instantiate them with their appropiate configuration, and load them:

```ts
import {
  AccessControlTypes,
  accessControlReduxModule,
  entitiesReduxModule,
  EntitiesTypes
} from '@uprtcl/common';

await orchestrator.loadModules(
  { id: EntitiesTypes.Module, module: entitiesReduxModule() },
  { id: AccessControlTypes.Module, module: accessControlReduxModule() }
);
```

## Drafts and access control

> Not yet ready
