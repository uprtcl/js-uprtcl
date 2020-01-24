# @uprtcl/micro-orchestrator

>_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

`Micro-orchestrator` is a new library to help coordinate different frontend modules, to build entire applications from small building blocks. This micro-modules can depend on one another,

It's inspired by the `micro-frontends` pattern, and wants to extend it to enable micro modules grouped by funcionality, that can interact from one another with or without clearly defined boundaries.

It uses `InversifyJs` for all dependency management.

## Install

```bash
npm install @uprtcl/micro-orchestrator
```

## Usage

### Usage from the application

#### Instantiate `micro-orchestrator`

A single instance of `micro-orchestrator` should be created on the top level of the consuming application.

```ts
import { MicroOrchestrator, ReduxStoreModule } from '@uprtcl/micro-orchestrator';
import { MyModule } from 'third-party-library';

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModules(
  {
    id: 'myModule',
    module: MyModule
  },
  {
    id: ReduxBindings.Module,
    module: ReduxStoreModule
  }
);

// Module functionality ready to be used here
```

#### Requesting a dependency from an element

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

const event = new RequestDependencyEvent({
  detail: { request: [ReduxBindings.Store] },
  composed: true,
  bubbles: true
});

const resolved = this.dispatchEvent(event);
const reduxStore = event.dependencies[0];
// Do things with reduxStore...
```

Or if you are building a native HTMLElement (or any subtype) you can use the simple `moduleConnect()` mixin, which provides a helper `request()` function.

```ts
import { moduleConnect, ReduxBindings} from '@uprtcl/micro-orchestrator';

export class MyCustomElement extends moduleConnect(HTMLElement) {
  connectedCallback() {
    super.connectedCallback();

    this.reduxStore = this.request(ReduxBindings.Store);

    // Do things with reduxStore...
  }
}
```

### Building your own module

TBD
