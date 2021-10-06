## Client Interfaces

The \_Prtcl Typescript interfaces can be used as the basis to introduce the architecture of a \_Prtcl application.

### Client

The most basic interface is the [`Client`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/interfaces/client.ts) interface.

A `Client` role is to create, read, update and delete a perspective head.

A set of changes to perspectives that include creating, updating and/or deleting one or multiple perspectives is called an `EveesMutation`.

A `Client` exposes the `update(mutation: EveesMutation)` method which can batch create, update and/or delete multiple perspectives at once.

An `EveesRemote`, for example, extends the `Client` interface.

These are the essential parts of the `Client` interface:

```ts
export interface Client {
  /** get a perspective head,
   * include a Slice that can be used by the client to pre-fill the cache */
  getPerspective(
    perspectiveId: string,
    options?: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult>;

  /** create/update perspectives and entities in batch */
  update(mutation: EveesMutationCreate): Promise<void>;

  /** convenient methods to edit a single perspective or set one entity at a time */
  newPerspective(newPerspective: NewPerspective): Promise<void>;
  deletePerspective(perspectiveId: string): Promise<void>;
  updatePerspective(update: Update): Promise<void>;
}
```

### ClientMutation

A [`ClientMutation`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/interfa,ces/client.mutation.ts) is a `Client` that is designed to live on top of another "base" `Client`, and that stores all the changes made _relative_ to that base Client.

Once these changes are stored, a `ClientMutation` offers the option to `flush()` gthem into the base `Client` as a single `update()` call.

These are the essential parts of the `ClientMutation` interface:

```ts
export interface ClientMutation extends Client {
  base: Client;

  /** get all the changes relative to the underlying client */
  diff(options?: SearchOptions): Promise<EveesMutation>;

  /** sync all the temporary changes made on this client with the base layer,
   * if levels = -1 (or undefined), then recursively flush the base layer,
   * otherwise flush only a number of layers equal to levels */
  flush(options?: SearchOptions, levels?: number): Promise<void>;

  /** delete all changes done and cached in this client. */
  clear?(mutation?: EveesMutation): Promise<void>;
}
```

### ClientRemote

A `ClientRemote` is simple a `Client` with a remote `id`, a function to synchronously snap new perspectives (create the id of a perspective) and an `EntityRemote`, where all the entities associated to perspectives stored in that `ClientRemote` should be persisted.

These are the essential parts of the `ClientRemote` interface

```ts
export interface ClientRemote extends ClientAndExploreCached, Ready, ConnectionLogged {
  /**
   * The id is used to select the remote from the listed of available Remotes.
   * The defaultPath is used to simplify "get" or "create"s operations that dont receive a path.
   */
  id: string;
  entityRemote: EntityRemote;

  snapPerspective(
    perspective: PartialPerspective,
    guardianId?: string
  ): Promise<Secured<Perspective>>;
}
```

### ClientExplore

As already mentioned in the Explore section, quering for perspectives based on their content, links and children is done by a `ClientExplore`. A client explore simple adds the `explore()` method to a `Client`.

```ts
export interface ClientExplore {
  explore(
    searchOptions: SearchOptions,
    fetchOptions?: GetPerspectiveOptions
  ): Promise<SearchResult>;
}
```
