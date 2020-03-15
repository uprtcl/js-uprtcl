# Using the Evees module

Loading and using the `EveesModule` together with your "data" module has several advantadges:

- It provides **out of the box updating, forking and merging content-addressable data**.
- It provides automatic **version control history**.
- It provides an **updatable hash** by which you can reference content that is self updating.
- [TBD] It will provide automatic signature check.

> If you haven't yet, read the [\_Prtcl spec](https://github.com/uprtcl/spec) to know about the \_Prtcl and its possibilites.

`Evees` are content-agnostic: each commit can point to any kind of content-addressable entity. This enables the creation of multiple modules that **implement different types of data** to be pointed to from a `Commit`.

Each of these `MicroModules` is independent of one another, although they may import services from any other module. This enables you to **install and load those modules that implement the entities and behaviours that you want to be able to manage in your application**.

Maybe not all content-addressable objects are suitable to be modeled after Evees: we think there is going to be experimentation and diversity until we find what works and what doesn't.

To include `Evees` management in your application, you have to configure and load the `EveesModule` in the `MicroOrchestrator`. You can use this as an example:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { IpfsConnection } from '@uprtcl/ipfs-provider';
import { HolochainConnection } from '@uprtcl/holochain-provider';
import { EthereumConnection } from '@uprtcl/ethereum-provider';
import { EveesModule, EveesEthereum, EveesHolochain, EveesBindings } from '@uprtcl/evees';

const ipfsConnection = new IpfsConnection({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

// Don't put anything on host to get from Metamask's ethereum provider
const ethConnection = new EthereumConnection({});

const eveesEth = new EveesEthereum(ethConnection, ipfsConnection);

const hcConnection = new HolochainConnection({ host: 'ws://localhost:8888' });

const eveesHolochain = new EveesHolochain('test-instance', hcConnection);

const evees = new EveesModule([eveesHolochain, eveesEth]);

const orchestrator = new MicroOrchestrator();

await orchestrator.loadModule(evees);
```

## Evees

`Evees` (Evolving Entities) are ever evolving, forking and merging data structures that can live and coevolve in different platforms.

They are made of two basic entities: `Perspectives` (_branches_ in git) and `Commits`. This is the basic GraphQl types that the `EveesModule` registers:

```graphql
type Perspective implements Entity {
  id: ID!

  head: Commit @discover
  name: String
  context: Context
  payload: Payload
  proposals: [UpdateProposal!]

  _context: EntityContext!
}

type Commit implements Entity {
  id: ID!

  parentCommits: [Commit!]! @discover
  timestamp: Date!
  message: String
  data: Entity @discover
  creatorsIds: [ID!]!

  _context: EntityContext!
}
```

You can see the complete schema and all the mutations available [here](https://github.com/uprtcl/js-uprtcl/blob/master/modules/evees/src/graphql/schema.ts).

## Using Evees

After loading the `EveesModule` and all its dependencies, and also the "data" modules you want to include, all the infrastructure is set for you to declare any custom element defined in any of those modules inside your web application:

```html
<body>
  <module-container>
    <!-- Any kind of custom element defined in the modules or in your app is available here -->
    <wiki-drawer .wiki="${WIKI}"></wiki-drawer>
  </module-container>
</body>
```

You can see our [simple-editor demo](https://github.com/uprtcl/js-uprtcl/tree/develop/demos/simple-editor) for a small usage of the `EveesModule`.

## Using `<cortex-entity>`

There is a special built-in custom element defined in [`@uprtcl/lenses`](https://uprtcl.github.io/js-uprtcl/modules/packages/uprtcl-lenses.html): `<cortex-entity>`.

This element takes as an input a `hash` value, and is able to:

1. **Fetch the object** identified with the given hash from the registered `Sources`.
2. **Recognize which patterns** does the object implement, and in particular which `lenses` are registered.
3. Picks and **renders a lens** to display the given object.

In practice, this makes `<cortex-entity>` a dynamic rendering engine, in which the instantiator of the element doesn't need to now anything about the entity they want to render other than its hash.

> In the future, as new ways of referencing objects appear, this may change. Eg, you may need to include the source identifier for `<cortex-entity>` to be able to fetch the object.

## Building a "data" module for Evees

Refer to [Developing a Cortex Module](/guides/cortex/what-is-cortex) to know how to fully develop a cortex module for your data structures. The additional steps needed to integrate your entities with `Evees` are:

- Implement the [Mergeable property](https://github.com/uprtcl/js-uprtcl/blob/develop/modules/evees/src/graphql/schema.ts) for all entities that can be referenced from a Commit ([example](https://github.com/uprtcl/js-uprtcl/blob/master/modules/documents/src/patterns/text-node.entity.ts)).
- Implement the [HasChildren property](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/cortex/src/properties/has-links.ts) for all entities that can be referenced from a Commit, returning the list of hashes that reference "children" entities ([example](https://github.com/uprtcl/js-uprtcl/blob/master/modules/wikis/src/patterns/wiki.entity.ts)).
- Register all necessary [sources](/guides/cortex/building-blocks/sources) to be able to retrieve all your entities.
- [Create a GraphQl schema](/guides/cortex/building-blocks/graphql-schemas) extension in which your data types implement the `Entity` type.

## List of built-in modules with compatible with Evees

- [`@uprtcl/documents`](/modules/modules/uprtcl-documents): implements `TextNode` entities and a general purpose text-editor that is updated throught Evees.
- [`@uprtcl/wikis`](/modules/modules/uprtcl-wikis): implements `Wiki` entities and a wiki drawer to contain multiple documents.
