# Loading Cortex

To include Cortex in your application, simply import and load the base `CortexModule` into your `MicroOrchestrator`:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule } from '@uprtcl/cortex';

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModules([new ApolloClientModule(), new CortexModule()]);
```

`ApolloClientModule` is a dependency of `CortexModule`, so we need to load it as well. This is because `CortexModule` provides native integration with `ApolloClient` type matching, by using its pattern recognition.

## Registering a Pattern to be recognized

In order to register the patterns you have built, you need to add your patterns to a `PatternsModule` and load it.

You have two ways:

- Instantiate and load the `PatternsModule` directly:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternsModule } from '@uprtcl/cortex';

import { TextLenses, TextActions } from './text-patterns';

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModules([new ApolloClientModule(), new CortexModule()]);

// Instantiate PatternsModule
const patternsModule = new PattersModule({
  [Symbol('text-pattern')]: [TextLenses, TextActions]
});

// Load the PatternsModule directly
await orchestrator.loadModule(patternsModule);
```

- Declare the `PatternsModule` as a submodule part of a bigger module:

```ts
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { TextLenses, TextActions } from './text-patterns';
import { TextLensElement } from './text-lens-element';

export class TextModule extends MicroModule {
  static id = Symbol('text-module');

  static bindings = {
    TextPattern: [Symbol('text-pattern')]
  };

  async onLoad() {}

  submodules = [
    new ElementsModule({
      'text-lens-element': TextLensElement
    }),
    new PatternsModule({
      [TextModule.bindings.TextPattern]: [TextLenses, TextActions]
    })
  ];
}
```

And then instantiate and load that module:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternsModule } from '@uprtcl/cortex';

import { TextModule } from './text-module';

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModules([new ApolloClientModule(), new CortexModule()]);

// Load the TextModule
await orchestrator.loadModule(new TextModule());
```
