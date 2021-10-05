## Client stack

Clients are designed to be stacked one on top of each other. This way an application can make changes on the top layer, and only flush these changes to lower layers when considered necessary.

A defaul stack is built by the [`initDefaultClientStack(...)`](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/creator-helpers/init.default.clients.ts) function.

This function will instantiate the following Client layers:

- An on-memory ClientMutation as the top layer.
- A local ClientMutation that persist changes on the browser IndexedDB
- A ClientCache service that caches the perspective heads read from the ClientRemotes.
- A ClientRouter service that routes mutations to their corresponding ClientRemote.
- One or more ClientRemotes.

Besides the Clients stack, the app will also have an EntityResolver connected to some EntityRemotes.

The diagram below provides a detailed overview of the combination of multiple Client layers and the EntityResolver.

![](https://docs.google.com/drawings/d/e/2PACX-1vTbBmQZV6GNYqiqxzlZLFwCVKQ-i19faPYUTR6djz_VHwTu4q1JPjHz2hxAZrSL8B22mpW5wtoYOaqO/pub?w=3216&h=1540)
