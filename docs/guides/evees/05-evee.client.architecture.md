# How can I handle \_Prtcl data on a web-app?

\_Prtcl includes a set of client libraries that help you build multi-platform content-management applications. These libraries offer:

- Connection to one or more Evees Remotes and Entity Remotes to store perspectives and entities.

- Multi-layer state management architecture to efficiently create and update content asynchronously (local-first) and periodically flush cummulative changes to remotes.

- Multi-layer cache architecture to efficiently keep local cached versions of the latest version/head of perspectives from multiple remotes.

- Real time events-based reactivity to observe updates to perspectives.

- Recursive forking and merging of perspectives and perspectives ecosystems.

- Reusable web-components to visualize perspective details.

An `EveesService` instance is a convenient wrapper around other \_Prtcl services. It is initialized with a list of `EntityRemote`s, and an `EntityResolver` and can then be used to convenientely create and manipulate \_Prtcl perspectives.

A simple example of how to initialize the `EveesService` using a local `EveesRemote` (an EveesRemote that stores data on the browser IndexedDB) is shown below:

```js
/** We first need to instantiate an EntityResolver, which will resolve hashes into their corresponding entities */
const entityRemote = new EntityRemoteLocal();
const entityRouter = new RouterEntityResolver([entityRemote]);
const entityResolver = new EntityResolverBase(entityRouter);

/** We then instantiate a PerspectiveStoreDB using IndexedDB to serve as our "local" Remote data storage */
const perspectiveStoreDB = new PerspectivesStoreDB();

/** The local explore service receives the local PerspectiveStoreDB to search for perspectives */
const exploreService = new LocalExplore(perspectiveStoreDB);

/** The EveesRemote is, then, a local remote that needs the EntityResolver, to resolve entities during its operations, the perspectiveStoreDB, to create and update perspectives, the entityRemote, to persist entities, and the ExploreService, to query perspectives */
const eveesRemote = new ClientRemoteLocal(
  entityResolver,
  perspectiveStoreDB,
  entityRemote,
  exploreService
);
```

You can run the app from [this repository]().
