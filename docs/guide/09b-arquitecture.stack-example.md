## Client Stack Example

### Create

Let's say our app want's to create one container object and add two objects inside of it.

This can be done as follows:

```ts
const container1 = await this.evees.createEvee();
const child1 = await this.evees.createChild();
const child2 = await this.evees.createChild();

const container2 = await this.evees.createEvee();
await this.evees.addExistingChild(container2, child1);
```

These changes will create the perspectives on the top client (in memory).

So the data would look like this:

![](https://docs.google.com/drawings/d/e/2PACX-1vSb3y--4lN8A9if7pDb86V77QNL6ygB-R6FBtrpq1KnBIOg3z0BCToFTtR98Ymh-UvQFePKyR0z8YEn/pub?w=1600&a=2)

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
 *     A total of 4 perspectives would be listed in the "newPerspectives" array.
 *     ...
 *   ]
 * }/*
```

### Flush

Let's now assume we want to persist these changes in our remotes. We can do this by calling the `flush()` command. At this point these changes are removed from the `ClientMutation` layer and sent to the `ClientRemote` as a single `EveesMutation` object.

The data would then look like this:

![](https://docs.google.com/drawings/d/e/2PACX-1vTE1pev577vbOwxW5zqQrmzJ1sc_t5uI0AU1WCcchUeLqarlelZ3WXX_2ZWHldbUxhQsxeJ32m8muoL/pub?w=1600&a=1)

### Update

Now let's consider the case where the app want's to update the content of a perspective, let's say add a new child. It can simply do it by calling

```ts
const child3 = await this.evees.addNewChild(c1, {});
```

Because we have not flushed it, this operation is applied to the top layer ClientMutation only, which stores the changes on memory. Two things are done when adding a new child, a new perspective is created, and the parent is updated to add that new perspective as a child. The ClientMutation stored on the onMemory Client is then

```ts
const diff = await this.evees.client.diff();

/**
 * diff = {
 *   newPerspectives: [
 *     {
 *       perspective: {
 *         hash: k3,
 *         object: ...
 *       },
 *       update: {
 *         details: {
 *           headId: hk1
 *         }
 *       }
 *     },
 *   ],
 *   updates: [
 *     {
 *       perspectiveId: c1,
 *       details: {
*          headId: hc1-2
 *       }
 *     }
 *   ]
 * }/*
```

The data would then look like this:

![](https://docs.google.com/drawings/d/e/2PACX-1vSO9sFU9KFTRcem2GhvjqDfbxA1LCMg4dZCEpQMBNKb9yubQM0j2CnhiPBF7oQR1mMxIdCpav5ahAPB/pub?w=1600)
