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

You can run the app from [this repository]().
