# Installing the MicroOrchestrator

The [`MicroOrchestrator`](https://github.com/uprtcl/js-uprtcl/tree/develop/packages/cortex) is the base point of any application built with the `_Prtcl` infrastructure. It's the base package that provides modules loading, dependency injection and deduplication of common module dependencies.

## Installation

To include the `micro-orchestrator` in your webapp, just install it with `npm`:

```bash
npm install @uprtcl/micro-orchestrator
```

## Usage

It is recommended that your have only one instance of the `micro-orchestrator`. This follows the *Composition Root pattern*, in which you declare all modules and functionalities that your application will have only in one file and have that file as close to the root of your application as possible.

This avoids having multiple places in which modules are loaded and imported, which can make it difficult to reason about all your dependencies.

Import the `micro-orchestrator` and instantiate it:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';

const orchestrator = new MicroOrchestrator();
```

Part of what the `micro-orchestrator` will do is contain and inject all the dependencies included in your modules. To achieve this, it uses [InversifyJS](https://github.com/inversify/InversifyJS) underneath. To access the `InversifyJS` container directly:

```ts
const container = orchestrator.container;

// Here we have access to inversify container API
```

To prepare the dynamic dependency for elements in the HTML page, include the `<module-container>` custom element as the top element in your application:

```html
<body>
  <module-container>
    <!-- The rest of the application goes here  -->
  </module-container>
</body>
```

This element does not produce any HTML by itself. It's only waiting for the native DOM event `RequestDependencyEvent`, and will ask for the requested dependencies to the inversify container and make them available to the element.
