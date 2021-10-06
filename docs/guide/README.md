# Introduction

The Underscore Protocol (**\_Prtcl**) offers a set of tools for building interoperable content-management applications compatible with Web3 platforms and Web2 APIs.

It combines some of the concepts of The Web and Linked Data, promoting the use of global identifiers for every data object that is handled by a web application, with the data structure of GIT, where each object evolves as a sequence of linked snapshots (commits).

Objects from \_prtcl-compatible applications are suitable to be:

- _referenced_ from any other application and platform, using URL-like global identifiers extended to include emerging web3 platforms.

- _rendered and updated_ on any other application, with reusable web-components and data type recognition.

- _forked_ by creating new branches of the same object on different platforms and by different authors.

## Client Libraries

\_Prtcl client libraries can be used to create and update \_Prtcl objects on one ore more platforms from the same application. The libraries include multi-layer mutation buffering, data fetching cache, and event-based reactivity for efficiently reading and updating data.

## Remotes

\_Prtcl remotes are servers or connectors to Web3 networks that can store and update \_Prtcl content. Similar to a web-server, they resolve object's unique ids into their current content.

For Web2 applications \_Prtcl offers a NodeJS + DGraph headless CMS that can be deployed inhouse, or consumed directly from the cloud.

For Web3 applications \_Prtcl offers connectors with Ethereum, Polkadot, Holochain and OrbitDB networks. These services can be paired with our web-server CMS to offer, indexing, discovery and performant data fetching.

## Modules and UI Components

\_Prtcl is building Intercreativity, a web-application that is similar to recent applications like Notion or Roam Research, but that is \_prtcl-compatible.

Intercreativity is extensible and modules and UI components from Intercreativity, such as it's block-based text editor, are built to be reusable on other content-management applications.

## Ok! What's next then?

**[\_Prtcl Architecture](/guides/evees)**: An overview of \_Prtcl primitives used to handle linked objects from multiple platforms.
