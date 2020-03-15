# @uprtcl/redux

[![](https://img.shields.io/npm/v/@uprtcl/redux)](https://www.npmjs.com/package/@uprtcl/redux)

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
