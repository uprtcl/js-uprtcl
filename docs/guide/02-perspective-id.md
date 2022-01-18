# Global Identifiers

A perspective id is equivalent to a URL, except that

- It is expected to always return a string. That string will be the hash of a JSON object that will be the head commit (latest version) of that perspective.

- It extends the supported locations (authority/remote) or URLs to not only web-servers but also web3 networks.

In addition, and since \_Prtcl is already heavily reliant on the use of Entities (hashed objects), the perspective id is not a formatted string (as is a URL), but is the hash of a JSON object whose properties include all the perspective properties.

For example, a perspective that is stored on the ethereum xdai chain (ethereum network id 100) and governed by \_Prtcl's smart contract could have the perspective id: `zb2wwrwEhBDLxcLdaeMqNB4uJem5unACXPB8zi5dGKACgbDYF` since that hash resolves to the following object:

```js
const perspective: Perspective = {
  remote: 'eth-100',
  path: '0xcfeb869f69431e42cdb54a4f4f105c19c080a601',
  creatorId: '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1',
  timestamp: 1631013963562,
  context: 'zb2wwv9fxwCivCGLHbp7iF1QtoQKjyJVKTTHaBkpX4FCrb1MH',
};

const perspectiveId: string = hashObject(perspective);
// perspectiveId = zb2wwrwEhBDLxcLdaeMqNB4uJem5unACXPB8zi5dGKACgbDYF
```

Relying on hashes that encode the properties of the locator instead of a formatted string offers a condensed and flexible way for adding an arbitrary number of new and special properties to the locator without resulting on a very long string, at the expense of reducing it's human readibility.

The typescript interface of the `Perspective` can be seen [here](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/interfaces/types.ts#L7).

```ts
interface Perspective {
  remote: string;
  path: string;
  creatorId: string;
  context: string;
  timestamp: number;
  meta?: any; // optional parameters handle arbitrary metadata
}
```

The optional `meta` property can be used to add arbitrary properties similar to "query" attributes in a URL.

## Offline computation

\_Prtcl applications must be able to compute the id of a perspective locally, without requesting it to the corresponding remote. This let's applications rapidly create new ids on the fly without having to wait for the remote to provide them.

Id collisions are avoided by having, at least, the `remote`, `creatorId` and `timestamp` properties as part of the perspective entity, and offering an optional `nonce` property that can be used by the creating app to force different ids if necessary.
