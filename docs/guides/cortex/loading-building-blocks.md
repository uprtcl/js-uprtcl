# Loading building blocks

In order to register your building blocks (patterns, lenses, sources...) and make them available to all other modules and elements, you have two ways:

- Instantiate and load the individual modules (`PatternsModule`, `CASModule`, `GraphQlSchemaModule` and `ElementsModule`) directly:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternsModule } from '@uprtcl/cortex';

import { TextLenses, TextActions, TextPattern } from './text-patterns';

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModules([new ApolloClientModule(), new CortexModule()]);

// Instantiate PatternsModule
const patternsModule = new PatternsModule([new TextPattern([TextActions, TextContent])])

// Load the PatternsModule directly
await orchestrator.loadModule(patternsModule);
```

- Declare all the modules you need as submodules, part of a bigger module:

```ts
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { CASModule } from '@uprtcl/multiplatform';
import { PatternsModule } from '@uprtcl/cortex';

import { TextLenses, TextActions, TextPattern } from './text-patterns';
import { TextLensElement } from './text-lens-element';
import { LocalSource } from './text-source';
import { typeDefs, resolvers } from './graphql';

export class TextModule extends MicroModule {
  static id = 'text-module';

  static bindings = {
    TextType: 'Text'
  };

  async onLoad() {}

  get submodules() {
    [
      new GraphQlSchemaModule(typeDefs, resolvers),
      new CASModule([new LocalSource()]),
      new PatternsModule([new TextPattern([TextLenses, TextActions])])
    ];
  }
}
```

And then instantiate and load that module:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule } from '@uprtcl/multiplatform';
import { CortexModule, PatternsModule } from '@uprtcl/cortex';
import { LensesModule } from '@uprtcl/lenses';

import { TextModule } from './text-module';

const orchestrator = new MicroOrchestrator();

// Load all base modules
await orchestrator.loadModules([
  new ApolloClientModule(),
  new CortexModule(),
  new DiscoveryModule(),
  new LensesModule({})
]);

// Load the TextModule
await orchestrator.loadModule(new TextModule());
```
