# What is a perspective id?

A perspective id is equivalent to a URL, except that

- It is expected to always resturn a JSON object (content-type: application/json) that will be the hash of the head commit (latest version) of that perspective

- It extends the supported locations (authority/remote) to not only web-servers but also web3 networks.

In addition, and since \_Prtcl is already heavy reliant on the use of hashed objects, the perspective id is not a formatted string (as is a URL), but is the hash of a JSON object whose properties include all the perspective properties.

For example, a perspective that is stored on the ethereum xdai (network id 100) and governed by \_Prtcl smart contract could have the perspective id: `zb2wwrwEhBDLxcLdaeMqNB4uJem5unACXPB8zi5dGKACgbDYF` since:

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

Relying on hashes that encode the properties of the locator instead of a formatted string reduces it's human readibility. However it offers a condensed and flexible way for adding an arbitrary number of new and special properties to the locator without resulting on a very long string.

## Offline computation

In \_Prtcl, it is possible to compute the id of a perspective locally, without requesting it to the corresponding remote. This let's applications rapidly create new ids on the fly without having to wait for the remote to provide them.

Id collisions are avoided by having the `remote`, `creatorId` and `timestamp` properties as part of the perspective id, and offering an optional `nonce` property that can be used by the creating app to force different ids if necessary.
