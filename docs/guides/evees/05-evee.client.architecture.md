# How can I handle \_Prtcl data on a web-app?

\_Prtcl includes a set of client libraries that help you build multi-platform content-management applications. These libraries offer:

- Connection to one or more Evees Remotes and Entity Remotes to store perspectives and entities.

- Multi-layer state architecture to efficiently create and update content asynchronously (local-first) and periodically flush cummulative changes to remotes.

- Multi-layer cache architecture to efficiently keep local cached versions of the latest version/head of perspectives from multiple remotes.

- Real time events-based reactivity to observe updates to perspectives.

- Recursive forking and merging of perspectives and perspectives ecosystems.

- Reusable web-components to explore a perspective.

An `EveesService` instance is a convenient wrapper around other \_Prtcl services. It is initialized with a list of Entity Remotes, and an EntityResolver and can then be used to convenientely create and manipulate \_Prtcl perspectives.

The code below shows a simple example in which a local Evees Remote and Entity Resolver are used (perspectives and entities are simply stored on the browser's local storage).

```js
const entityRemote = new LocalEntityRemote();
const eveesRemote = new LocalEveesRemote();
```
