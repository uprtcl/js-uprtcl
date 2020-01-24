# @uprtcl/redux

> \_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)
> /)

These are \_Prtcl `micro-orchestrator`'s modules to integrate redux in your applications.

## Install

```bash
npm install @uprtcl/redux
```

## Usage

Import the modules, instantiate them with their appropiate configuration, and load them:

```ts
import { ReduxStoreModule } from '@uprtcl/redux';

const reduxModule = new ReduxStoreModule();

await orchestrator.loadModule(reduxModule);
```
