# @uprtcl/micro-orchestrator

[![](https://img.shields.io/npm/v/@uprtcl/micro-orchestrator)](https://www.npmjs.com/package/@uprtcl/micro-orchestrator)

`MicroOrchestrator` is a small new library to help coordinate different frontend modules, to build entire applications from small building blocks. These `MicroModules` can depend on one another, or be built by composing different submodules.

It's inspired by the `micro-frontends` pattern, and wants to extend it to enable micro modules grouped by funcionality, that can interact from one another with or without clearly defined boundaries.

To achieve this, it uses:

* `InversifyJs` for all dependency management.
* `LitElement` to define custom elements.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/micro-orchestrator
```

## Usage

### Instantiate `micro-orchestrator`

A single instance of `micro-orchestrator` should be created on the top level of the consuming application.

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ReduxStoreModule } from '@uprtcl/redux';
import { MyModule } from 'third-party-library';

const orchestrator = new MicroOrchestrator();

const myModule = new MyModule();
const reduxModule = new ReduxStoreModule();

await orchestrator.loadModules([myModule, reduxModule]);

// Module functionality ready to be used here
```

### Requesting a dependency from an element

In your `html` code, include the `<module-container>` element as the top level element where you want to use the `micro-orchestrator` funcionality.

```html
<body>
  <module-container>
    <!-- The rest of the application goes here  -->
  </module-container>
</body>
```

The `<module-container>` element expects for the `RequestDependencyEvent` (native Dom event). You simply need to dispatch it from an element contained inside the `<module-container>`.

In its detail, you need to specify the identifier of the dependencies you want to request.

```ts
import { RequestDependencyEvent } from '@uprtcl/micro-orchestrator';
import { ReduxStoreModule } from '@uprtcl/redux';

const event = new RequestDependencyEvent({
  detail: { request: [ReduxStoreModule.bindings.Store] },
  composed: true,
  bubbles: true
});

const resolved = this.dispatchEvent(event);
const reduxStore = event.dependencies[0];
// Do things with reduxStore...
```

Or if you are building a native HTMLElement (or any subtype) you can use the simple `moduleConnect()` mixin, which provides a helper `request()` function.

```ts
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ReduxStoreModule } from '@uprtcl/redux';

export class MyCustomElement extends moduleConnect(HTMLElement) {
  connectedCallback() {
    super.connectedCallback();

    this.reduxStore = this.request(ReduxStoreModule.bindings.Store);

    // Do things with reduxStore...
  }
}
```

## Building your own module

Learn more about developing your own `MicroModule` in our [documentation page](https://uprtcl.github.io/js-uprtcl/guides/develop/developing-micro-modules.html).
