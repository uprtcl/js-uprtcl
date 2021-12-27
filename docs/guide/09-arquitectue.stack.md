## Client Stack

Clients are designed to be stacked one on top of each other. This way an application can make changes on the top layer, and only flush these changes to lower layers in batches and when considered necessary.

A defaul stack is built by the [`initDefaultClientStack(...)`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/creator-helpers/init.default.clients.ts) function.

This function will instantiate the following Client layers: s

- An on-memory ClientMutation as the top layer.
- A local ClientMutation that persist changes on the browser IndexedDB
- A ClientCache service that caches the perspective heads read from the ClientRemotes.
- A ClientRouter service that routes mutations to their corresponding ClientRemote.
- One or more ClientRemotes.

Besides the Clients stack, the app will also have an EntityResolver connected to some EntityRemotes.

The diagram below provides a detailed overview of the combination of multiple Client layers and the EntityResolver.

![](https://docs.google.com/drawings/d/e/2PACX-1vTocAPKJPvtMO1knRTGPcibhsj345Irqr0RUAxEqnJaag_h8aazijV-eUsWtF5wZzV0w0BowtxpriKC/pub?w=500&a=4)

Some things to notice from the figure are:

- The app interacts only with the EveesService.
- There are two ClientMutation layers, one in memory, and the other one in the browser storage (indexedDB).
- The EntityResolver is global, and is capable of resolving any Entity anywhere in the app.
- There are two remotes, the ClientRemote that uses the [`ClientRemoteLocal`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/clients/local/client.remote.local.ts#L34) class, and the [`EntityRemoteLocal`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/clients/local/entity.remote.local.ts#L7). They both store the perspectives head and the entities in the browser storage.

## Using the Client Stack, an example

### Create

Let's say our app want's to create one container object and add two objects inside of it.

This can be done as follows:

```ts
const container1 = await this.evees.createEvee();
const child1 = await this.evees.createChild();
const child2 = await this.evees.createChild();

const container1 = await this.evees.createEvee();
await this.evees.addExistingChild(container2, child1);
```

These changes will create the perpectives on the top client (in memory).

So the data would look like this:

![](https://docs.google.com/drawings/d/e/2PACX-1vSb3y--4lN8A9if7pDb86V77QNL6ygB-R6FBtrpq1KnBIOg3z0BCToFTtR98Ymh-UvQFePKyR0z8YEn/pub?w=800&a=2)

- 4 new perspectives created on the OnMemory ClientMutation. Container 1 `c1` has `k1` and `k2` as childrent, while `c2` has `k1` as a child. The ClientMutation essentially stores the head of each perspective, which are marked in blue.
- 8 new entities stored in the EntityCache of the EntityResolver. 4 entities represent the head commits and the other 4 are the data entities, which are included inside the commit object as a link.

Calling the `diff()` method on the ClientMutation will return an EveesMutation object with 4 elements in the `newPerspectives` array. Each element will have the perspective payload, and the update details with the corresponding head.

```ts
const diff = await this.evees.client.diff();

/**
 * diff = {
 *   newPerspectives: [
 *     {
 *       perspective: {
 *         hash: c1,
 *         object: ...
 *       },
 *       update: {
 *         details: {
 *           headId: hc1
 *         }
 *       }
 *     },
 *     ...
 *   ]
 * }/*
```

### Flush

Let's now assume we want to persist these changes in our remotes. We can do this by calling the `flush()` command. At this point these changes are removed from the `ClientMutation` layer and sent to the `ClientRemote` as a single `EveesMutation` object.

The data would then look like this:

![](https://docs.google.com/drawings/d/e/2PACX-1vTE1pev577vbOwxW5zqQrmzJ1sc_t5uI0AU1WCcchUeLqarlelZ3WXX_2ZWHldbUxhQsxeJ32m8muoL/pub?w=800&a=1)

### Update

Now let's consider the case where the app want's to update the content of a perspective, let's say add a new child. It can simply do it by calling

```ts
await this.evees.addNewChild(c1, {});
```

Because we have not flushed it, this operation is applied to the top layer ClientMutation only, which stores the changes on memory. Two things are done when adding a new child, a new perspective is created, and the parent is updated to add that new perspective as a child.
