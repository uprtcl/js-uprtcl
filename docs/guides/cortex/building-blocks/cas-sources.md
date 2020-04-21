# CASSources & CASStores

**CASSources** are simple services that can connect to a **Content-Addressable Store and retrieve objects from their hash**.

**CASStores** are **CASSources** that also have the **ability to create generic objects in a JSON form** and get back the hash they have in that store.

CASSources **enable content-addressable objects to reference each other**, in a generic, platform-agnostic way. They are defined in [`@uprtcl/multiplatform`](/modules/packages/uprtcl-multiplatform) and widely used throughout all the modules.

Every [CASSource](https://github.com/uprtcl/js-uprtcl/blob/master/packages/multiplatform/src/types/cas-source.ts) has to implement this interface:

```ts
/**
 * A CASource (Content Addressable Storage Source) is a service that implements a standard function `get`,
 * which receives the hash of the object and returns it
 */
export interface CASSource extends Ready {
  /**
   * Uniquely identifies this CAS source from which to retrieve objects
   */
  casID: string;

  /**
   * Configuration with which to create objects in this store
   */
  cidConfig: CidConfig;

  /**
   * Get the object identified by the given hash,
   * or undefined if it didn't exist in the source
   *
   * @param hash the hash identifying the object
   * @returns the object if found, otherwise undefined
   */
  get(hash: string): Promise<object | undefined>;
}
```

Where the `casID` property uniquely identifies this source to retrieve content-addressable objects.

For example, if two modules register an [`IpfsStore`](https://github.com/uprtcl/js-uprtcl/blob/master/providers/ipfs/src/ipfs.store.ts), both sources need to have the same `casID` property defined.

This is because this property will be used to identify from which content-addressable space the object came from, and which source are the links from that content-addressable object referencing.

On the other hand, every [CASStore](https://github.com/uprtcl/js-uprtcl/blob/master/packages/multiplatform/src/types/cas-store.ts) only adds a generic `create` to the `CASSource` interface:

```ts
/**
 * A CASStore is a CASSource that can also store generic objects, returning their hash
 */
export interface CASStore extends CASSource {
  /**
   * Create the given object and returns its hash, as computed by the service
   *
   * @param object the object to store
   * @param hash (optional) the hash of the object with which it will be stored. If not given the default cidConfig will be used to calculate the hash.
   * @returns the hash of the object
   * @throws error if a hash was provided and it didn't match the generated hash
   */
  create(object: object, hash?: string): Promise<string>;
}
```

## Registering a CASSource

Registering `CASSources` and `CASStores` **allows for interoperability of different content-addressable platforms**. You can develop and register new `CASSources` that are compatible with a new platform, and all the \_Prtcl infrastructure and modules **will automatically work with it in a _plug-and-play_ way**.

To develop and register a source, follow these steps:

1. Create a service implementing the `CASSource` interface:

```ts
import { Dictionary } from '@uprtcl/micro-orchestrator';
import { CASSource, CidConfig, defaultCidConfig } from '@uprtcl/multiplatform';

export class TestSource implements CASSource {
  localObjects: Dictionary<any> = {
    hash1: {
      object: {
        text: 'A text stored in a CAS'
      }
    }
  };

  casID: string = 'test';
  cidConfig: CidConfig = defaultCidConfig;

  public async get(hash: string): Promise<object | undefined> {
    return this.localObjects[hash];
  }
}
```

2. Make sure that the base [`DiscoveryModule`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/multiplatform/src/discovery.module.ts) is instantiated and loaded in the `MicroOrchestrator`.

3. Create a [`CASModule`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/multiplatform/src/cas.module.ts) and initialize it with your `CASModule`. Instantiate and load the `CASModule`.

```ts
import { CASModule } from '@uprtcl/multiplatform';
import { TestSource } from './test-source';

const sourcesModule = new CASModule([new TestSource()]);

// ... MicroOrchestrator initialization and loading of base modules

await orchestrator.loadModule(sourcesModule);
```

4. Optionally, add a `create` function to your class to implement a `CASStore`:

```ts
import { Dictionary } from '@uprtcl/micro-orchestrator';
import { CASStore, CidConfig, defaultCidConfig } from '@uprtcl/multiplatform';
import { hashObject } from '@uprtcl/evees';

export class TestSource implements CASStore {
  localObjects: Dictionary<any> = {
    hash1: {
      object: {
        text: 'A text stored in a CAS'
      }
    }
  };

  casID: string = 'test';
  cidConfig: CidConfig = defaultCidConfig;

  public async get(hash: string): Promise<object | undefined> {
    return this.localObjects[hash];
  }

  public async create(object: object): Promise<string> {
    const hash = await hashObject(object);

    this.localObjects[hash] = object;

    return hash;
  }
}
```
