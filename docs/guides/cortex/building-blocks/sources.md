# Sources

**Sources** are simple services that can connect to a **content-addressable store and retrieve objects from their hash**. 

Sources **enable content-addressable objects to reference each other**, in a generic, platform-agnostic way. They are defined in [`@uprtcl/multiplatform`]() and widely used throughout all the modules.

Every source has to implement this interface:

```ts
import { Hashed } from '@uprtcl/cortex';

export interface Source extends Ready {
  source: string;

  get<T extends object>(hash: string): Promise<Hashed<T> | undefined>;
}
```

Where the `source` property uniquely identifies this source to retrieve content-addressable objects.

For example, if two modules register an [`IpfsSource`](https://github.com/uprtcl/js-uprtcl/blob/develop/providers/ipfs/src/ipfs.source.ts), both sources need to have the same `source` property defined.

This is because this property will be used to identify from which content-addressable space the object came from, and which source are the links from that content-addressable object referencing.

## Registering a source

To develop an register a source, follow these steps:

1. Create a service implementing the `Source` interface:

```ts
import { Dictionary } from '@uprtcl/micro-orchestrator';
import { Source } from '@uprtcl/multiplatform';

export class TestSource implements Source {

    localObjects: Dictionary<Hashed<any>> = {
        hash1: {
            id: 'hash1',
            object: {
                text: 'A text stored in a CAS'
            }
        }
    };

    source: string = 'test';

    public async get(hash: string): Promise<Hashed<any> | undefined> {
        return this.localObjects[hash];
    }

}
```

2. Make sure that the base [`DiscoveryModule`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/multiplatform/src/discovery.module.ts) is instantiated and loaded in the `MicroOrchestrator`.
3. Create a [`SourcesModule`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/multiplatform/src/sources.module.ts) and initialize it with your `Source`. Instantiate and load the `SourceModule`.

```ts
import { SourceModule } from '@uprtcl/multiplatform';
import { TestSource } from './test-source';

const sourcesModule = new SourcesModule([new TestSource()]);

// ... MicroOrchestrator initialization and loading of base modules

await orchestrator.loadModule(sourcesModule);
```
