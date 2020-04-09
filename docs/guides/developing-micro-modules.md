# Developing `MicroModules`

This guide assumes you have gone through [Using MicroModules](use/installing-the-micro-orchestrator) and already know the basic concepts about `MicroModules`.

Technically, a `MicroModule` is only a javascript class that extends from the [`MicroModule`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/micro-orchestrator/src/orchestrator/micro.module.ts) superclass. This superclass specifies certain properties that define how the module behaves, mainly what are its dependencies and how the modules loads itself.

## Properties of `MicroModules`

All `MicroModules` can define these properties:

- `id`: a unique identifier, which means that there should be only one instance of that module in the application.
- `bindings`: specify all the bindings that this module has registered to the `MicroOrchestrator` container during initialization.
- `dependencies`: identifier of all the modules that this module depends on. They need to be present when the module is loaded.
- `submodules`: all the modules that compose this bigger module. They will be loaded just before the present module is.

## `MicroModules` loading lifecycle

Here is the flow of how the `MicroOrchestrator` loads `MicroModules`, when executing the `loadModules()` function:

1. **Register all modules ids** to the list of modules being loaded at current time.

Now, for each module being loaded:

2. **Load dependencies first**:

- **Check the `dependencies` list** an make sure that the modules with specified ids there are already loaded or being loaded at the same time.
- If there are dependencies that are being loaded at the same time of the present module, load the dependencies first.
- After that, if some dependency is missing, **fail to load** the module.

3. Load submodules: **execute the load lifecycle** for each of the submodules.
4. **Execute the `onLoad` function** of the module being loaded.

## Defining your `MicroModule`

In this guide we are going to be using typescript to define our modules, but you can define them in javascript just as easily, without specifying the types of each variable.

### 1. Create a class extending from `MicroModule`

The first step is to define a standard class extending `MicroModule`. The only required property to set is the `onLoad` function:

```ts
import { interfaces } from 'inversify';
import { MicroModule } from '@uprtcl/micro-orchestrator';

export class MyModule extends MicroModule {
  // This function will be executed when the module is being loaded
  public async onLoad(container: interfaces.Container): Promise<void> {
    // Here we should execute any loading functions that our module requires to work
  }
}
```

The inversify container can be modified through the [Container API](https://github.com/inversify/InversifyJS/blob/master/wiki/container_api.md). But for now, we won't code our `onLoad` function just yet: first we're going to define dependencies and submodules.

### 2. Declare dependencies to other modules (optional)

Declaring dependencies is as easy as including the module's `id` in the `dependency` list property:

```ts
import { interfaces } from 'inversify';
import { CortexModule } from '@uprtcl/cortex';
import { MicroModule } from '@uprtcl/micro-orchestrator';

export class MyModule extends MicroModule {
  dependencies = [CortexModule.id];

  // This function will be executed when the module is being loaded
  public async onLoad(container: interfaces.Container): Promise<void> {
    // Here we should execute any loading functions that our module requires to work
  }
}
```

This is expressing that `MyModule` will only work when `CortexModule` is also loaded in the `MicroOrchestrator`.

### 3. Compose different submodules (optional)

Adding submodules is easy as well, adding the `submodules` property:

```ts
import { interfaces } from 'inversify';
import { CortexModule, PatternsModule } from '@uprtcl/cortex';
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { CustomPattern } from './custom-pattern';

export class MyModule extends MicroModule {
  dependencies = [CortexModule.id];

  get submodules() {
    return [new PatternsModule([new CustomPattern()])];
  }

  // This function will be executed when the module is being loaded
  public async onLoad(container: interfaces.Container): Promise<void> {
    // Here we should execute any loading functions that our module requires to work
  }
}
```

This will load all submodules before executing the `onLoad` function of our module. If any of the submodules specifies an `id` it will only get loaded once: multiple loads of a module with the same `id` will only execute the `onLoad` function once.

### 4. Define module bindings and register services (optional)

Every module **can register services, functions or any type of object inside the `Container`**. This objects will be made **available to any other module, as well as to all custom elements** defined inside the `customElements` registry.

When the `onLoad` method is called, you can assume:

- All dependencies will be available and loaded (you can get other module's bindings with `container.get()`)
- All submodules will be loaded

After this method is called, other modules will assume:

- All `bindings` declared by this module are available in the container (bind them using `container.bind()`)

```ts
import { interfaces } from 'inversify';

import { CortexModule } from '@uprtcl/cortex';
import { MicroModule, ElementsModule } from '@uprtcl/micro-orchestrator';

import { CustomPattern } from './custom-pattern';
import { HttpService } from './http-service';

export class MyModule extends MicroModule {
  dependencies = [CortexModule.id];

  get submodules() {
    return [new PatternsModule([new CustomPattern()])];
  }

  static bindings = {
    BackendService: 'http-service'
  };

  // This function will be executed when the module is being loaded
  public async onLoad(container: interfaces.Container): Promise<void> {
    // Here we should execute any loading functions that our module requires to work
    // And bind all services specified in the `bindings` property
    container.bind(MyModule.bindings.BackendService).to(HttpService);
  }
}
```

### 5. Define the module's id (optional)

If your module **only needs to be loaded once** and should serve as a **base layer for other modules to depend on**, you can specify the module's identifier with the `id` static property. This is akin to making the module 'singleton'.

This has some consequences:

- The module will only be loaded once: if `MicroOrchestrator` finds a module with the same `id` that one module already present, it will not load the module a second time.
- Other modules can specify a dependency to this module by including the module's `id` inside their `dependencies` property.

```ts
import { interfaces } from 'inversify';

import { CortexModule } from '@uprtcl/cortex';
import { MicroModule } from '@uprtcl/micro-orchestrator';

import { CustomPattern } from './custom-pattern';
import { HttpService } from './http-service';

export class MyModule extends MicroModule {
  static id = 'my-module';

  dependencies = [CortexModule.id];

  get submodules() {
    return [new PatternsModule([new CustomPattern()])];
  }

  static bindings = {
    BackendService: 'http-service'
  };

  // This function will be executed when the module is being loaded
  public async onLoad(container: interfaces.Container): Promise<void> {
    // Here we should execute any loading functions that our module requires to work
    // And bind all services specified in the `bindings` property
    container.bind(MyModule.bindings.BackendService).to(HttpService);
  }
}
```
