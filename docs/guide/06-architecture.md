# Introduction

\_Prtcl includes a set of libraries that help you build multi-platform content-management applications. These libraries offer:

- Connection to one or more Evees Remotes and Entity Remotes to store perspectives and entities.

- Multi-layer state management architecture to efficiently create and update content asynchronously (local-first) and periodically flush cummulative changes to remotes.

- Multi-layer cache architecture to efficiently keep local cached versions of the latest version/head of perspectives from multiple remotes.

- Real time events-based reactivity to observe updates to perspectives.

- Recursive forking and merging of perspectives and perspectives ecosystems.

- Reusable web-components to visualize perspective details.

# How can I use \_Prtcl libraries in my app?

A simple example of how to initialize \_Prtcl's libraries can be seen in this [example app](https://github.com/uprtcl/example-local). The app runs locally.

Here we will go over this app and introduce a typical \_Prtcl architecture.

## Initalization

A convenient wrapper around other \_Prtcl services is the [`EveesService`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/evees.service.ts) class.

The first task is then to create an instance of the `EveesService` class. For this, we need to provide the list of `EveesRemote` and `EntityRemote` that the app will know of, and which `ExploreSertive` to use.

In the case of the example app, both remotes, mutable and inmmutable, and the `ExploreService` are simply created locally, using the browser's IndexedDB.

You can see how the `EveesService` class is instantiated [here](https://github.com/uprtcl/example-local/blob/main/src/index.ts).

## Create, Update, Delete

Once the `EveesService` instance has been initialized it is made available to other web-components in the app (the example uses Lit-Element components) using the \_Prtcl `MultiContainer` wrapper component and made available in the [`App.ts`](https://github.com/uprtcl/example-local/blob/main/src/app.ts) component using the `servicesConnect()` factory function.

```ts
export class App extends servicesConnect(LitElement) {...}
```

The app is a simple note taking app, where each note is one perspective.

A note is created using

```ts
await this.evees.createEvee({ object: { text } });
```

By default, changes are applied only at the top level client (the OnMemory client), and thus they are applied very fast.

If we want to apply this changes to the lower levels, (the local mutation client and the local remote) we need to manually call the flush function.

```ts
await this.evees.createEvee({ object: { text } });
await this.evees.flush();
```

After calling flush, the note will be stored in the LocalEveesRemote. If the remotes were an external remote, say a web server, the perspective would be created in the server only after calling flush.

Updating and deleting are equivalent to creating a perspective. Here are the code snippets used in the example app:

```ts
await this.evees.updatePerspectiveData({
  perspectiveId: noteId,
  object: { text },
});
await this.evees.flush();
```

```ts
await this.evees.deletePerspective(noteId);
await this.evees.flush();
```

Finally all notes are obtained using the explore service with an empty query (essentially saying all known perspectives should be returned).

```ts
const result = await this.evees.explore({});
await Promise.all(
  result.perspectiveIds.reverse().map(async (noteId) => {
    const note = await this.evees.getPerspectiveData<Note>(noteId);
    this.notes.set(noteId, note);
  })
);
```

The query will result the notes ids, which need to be sent to the `getPerspectiveData()` function to retrieve their latest value.

In the next section we will dive deeper into the example, introduce the concept of mutations and provide a detailed diagram of the layer stack of services that are used in this app.
