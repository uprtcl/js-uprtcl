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

---

In the following sections, you'll learn how to develop and register the building blocks that make up cortex modules.