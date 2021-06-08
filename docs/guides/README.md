# Introduction

The Underscore Protocol (**\_Prtcl**) is a framework for building interoperable content-management applications compatible with Web2-APIs and emerging Web3 platforms.

It combines some of the concepts of The Web, such as global identifiers and links, with the data structure of GIT, where each object evolves as a sequence of chained hashed commit versions.

Content from \_Prtcl-compatible applications is suitable to be:

- _referenced_ from any other application. This uses URL-like global identifiers for mutable references that include emerging web3 platforms.

- _rendered_ on any other application. This is done with reusable web-components and dynamic object-type transformations.

- _forked_ by creating new branches, as new tips of the sequence of commits of the object that share a common ancestor.

- _interacted with_ from other applications. This is done by defining a limited set of basic primitives common to all content-management applications: namely _update_, _link_, _nest_ and _fork_.

- _explored_ from any application. This is done by including a limited query interface that all \_Prtcl storage providers must include.

## Global identifiers and basic R-CUD operations

\_Prtcl applications decouple data (JSON objects) from the app's user interface (JS) and expose unique global identifiers to all objects handled by the application.

These identifiers are referred to as perspective's ids. A perspective id is very similar in concept to a web URL, except it is expected to always resolve into a JSON object that is the latest version/commit object of that perspective.

In a way, it's like if applications would always include the URL of the API endpoint that serves that object.

However, and unlique an API URL, a perspective id is not directly resolved by the browser fetch method, but is handled by a custom javascript connector that talks to the perspective's remote, which can be custom.

Perspective ids are currently object hashes. This, instead of enforcing a string format to encode their properties like URLs, a JSON object is built with the properties and it's hash is used as the perspective id.

The reason for this is that perspective ids are expected to include growing metadata and this approach makes it easy to do so, without parsing and building structured strings.

Also, this also helps letting applications build perspective ids optimistically, and without communication to the remote. However, since perspective ids are expected to be globally unique, to prevent collisions these ids include the remote, the creator and the timestamp at the perspective creation.

For example: A perspective that is stored on the Ethereum Blockchain could look like this

```
perspective = {
    remote: 'ethereum-mainnet',
    path: '0xUprtclSmartContract',
    creator: '0xPerspectiveOwnerAddress',
    timestamp: 750000,
}

perspectiveId = hash(perspective) = QmABC.
```

A \_Prtcl application uses the `remote` property of the `Perspective` object to load a JS connector to that remote platform and sends the perspective id to that connector `getPerspective()` function to resolve the latest perspective head.

\_Prtcl perspectives are stored on "remotes", and these remotes must support basic CRUD operations, or better R-CUD operations, in the sense that the read operation is separated from the update operation, and the update operation is deisgned to handle Mutation objects, which group together a set of changes to more than one perspective including creating new ones or updating/deleting existing ones.

So, the first pattern that \_Prtc-applications support is the creation and update of data objects, each with a unique global identifier, and living on a given remote.

For Web2 applications it offers a NodeJS + DGraph service that can be deployed inhouse, or consumed directly from the cloud.

For Web3 applications it offers connectors with Ethereum, Polkadot, Holochain and OrbitDB networks. These services can be paired with the web-server for, indexing, discovery and performant data fetching operations.

## Modules and UI Components

\_Prtcl is building Intercreativity, a web-application that is similar to recent applications like Notion or Roam Research, but that is \_prtcl-compatible. Intercreativity is extensible and modules and UI components from Intercreativity are build to be reusable on other content-management applications.

# Where to start

What do you want to do now?
