## Client Stack

Clients are designed to be stacked one on top of each other. This way an application can make changes on the top layer, and only flush these changes to lower layers in batches and when considered necessary.

A default stack is built by the [`initDefaultClientStack(...)`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/creator-helpers/init.default.clients.ts) function.

This function will instantiate the following Client layers:

- An on-memory `ClientMutation` as the top layer.
- A local `ClientMutation` that persist changes on the browser IndexedDB
- A `ClientCache` service that caches the perspective heads read from the ClientRemotes.
- A `ClientRouter` service that routes mutations to their corresponding ClientRemote.
- One or more ClientRemotes.

Besides the Clients stack, the app will also have an `EntityResolver` connected to some EntityRemotes.

The diagram below provides a detailed overview of the combination of multiple Client layers and the EntityResolver.

![](https://docs.google.com/drawings/d/e/2PACX-1vTocAPKJPvtMO1knRTGPcibhsj345Irqr0RUAxEqnJaag_h8aazijV-eUsWtF5wZzV0w0BowtxpriKC/pub?w=1600&a=4)

Some things to notice from the figure are:

- The app interacts only with the EveesService.
- There are two ClientMutation layers, one in memory, and the other one in the browser storage (indexedDB).
- The EntityResolver is global, and is capable of resolving any Entity anywhere in the app.
- There is one ClientRemote that uses the [`ClientRemoteLocal`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/clients/local/client.remote.local.ts#L34) class, and one [`EntityRemoteLocal`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/clients/local/entity.remote.local.ts#L7). They both store the perspectives head and the entities in the browser storage.
