# @uprtcl/lenses

[![](https://img.shields.io/npm/v/@uprtcl/lenses)](https://www.npmjs.com/package/@uprtcl/lenses)

This package provides a basic lenses rendering engine for the `@uprtcl/cortex` framework. Cortex needs a rendering engine of this type in order for it to work in the frontend.

This module declares and exposes this native HTMLElement:

- `<cortex-entity>`: entry point of the engine. This element takes a `hash` property, and is responsible for fetching, recognizing, and rendering the object in the appropiate lens.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/lenses
```

## Usage

Import the module, instantiate it with its appropiate configuration, and load it:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { LensesBindings } from '@uprtcl/cortex';
import { LensesModule } from '@uprtcl/lenses';

const orchestrator = new MicroOrchestrator();

const lenses = new LensesModule();
await orchestrator.loadModule(lenses);
```

In your `html`, now you can use `<cortex-entity>`:

```html
<cortex-entity id="cortex-entity-rendering" ref="<REFERENCE-TO-THE-ENTITY-WE-WANT-TO-LOAD>" />
```

For now, the only type of supported reference is a the hash of the entity to load. Support for new types of reference will be added soon.