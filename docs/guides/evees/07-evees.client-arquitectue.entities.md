## Entities and the EntitiyResolver

Entities are hashed objects whose id is their hash. They comply with the `Entity` interface.

```ts
export interface Entity<T = any> {
  hash: string;
  object: T;
  remote: string;
}
```

The object property is a canonical JSON object (stored as a JS object) whose properties are ordered alphabetically and which is then serialized using [cbor](https://cbor.io/).

Once serialized, the hash of the bytes is obtained a hashing algorithm and the `hash` property is set as the [CID](ipfs://bafybeidkl4t5ydt2jl5p4ltfrsi6bee36yr22d5urjxx6rr76ev3ekb3pa/anatomy-of-a-cid) of the hash. Any valid `CID` is a valid `Entity` hash.

Entities are used by clients to store the head of each perspective, as a `Commit` object.

A commit has the hash of the parent commit and that of the actual data object, both of type `Entity`. This means that the head commit of a perspective has, encoded on its hash, an immutable summary of the entire history of the perspective (all its commits) and all the associated data objects of each commit.

In \_Prtcl, a global EntityResolver class is created to resolve any entity required by any function in the application. This reduces the complexity when exploring perspectives but forces us to manually chose the entities that need to be persisted together each Client.

## Entity availability strategy

Everytime a new entity is created (say a new commit is computed), this entity is included in the EntityResolver using the `putEntity()` function.

Putting an entity on the `EntityResovler` will not persisted it any `EntityRemote`. It will simply be stored in case another portion of the app needs it.

Entities are persisted into an `EntityRemote`, only when an `EveesMutation` (with new perspectives or updates) is sent to a `ClientRemote`. In that case, the Entities associated to the EveesMutation are identified and persisted in the EntityRemote associated with that EveesRemote.
