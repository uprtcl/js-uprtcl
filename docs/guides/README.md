# Introduction

The **\_Prtcl** implementation provides a generic, modular and extensible infrastructure to develop whole web applications by composing small building blocks together.

All of this is based on top of `MicroOrchestrator`, the base orchestrator for all the modules. This pattern is inspired by [micro-frontend](https://micro-frontends.org/), but wants to take this approach further using new emerging technologies, mainly [custom elements](https://developers.google.com/web/fundamentals/web-components/customelements) combined with extensible and composable [GraphQl](https://graphql.org/learn/) schemas.

This project is Open Source, so [feedback and contributions](https://github.com/uprtcl/js-uprtcl/issues) are very well welcome and appreciated!

## Where to start

There are **different ways of integrating _Prtcl** in your app. This guide covers 4 approaches with ascending level of depth and difficulty:

1. [How to install and use micro-modules](use/installing-the-micro-orchestrator): **only install, configure and use the modules that fit your requirements**, and develop your app on top of those.

2. [How to use the evees module](evees/using-the-evees-module): **evees** (or *Evolving entities*) are at the core of how the _Prtcl creates and evolves ideas; learn how to load and use them into your app.

3. [How to build a micro-module](develop/developing-micro-modules): appropriated if you want to create a **small group of services or elements that should be able to be reused** by other `MicroOrchestrator` applications.  

4. [How to build a cortex-module](cortex/what-is-cortex): **add a new type of entity** that can be referenced and is interoperable together with all other modules that implement **pattern behaviour**.

Choose the approach that fits better your needs. It is recommended to start from only using `MicroModules`, and progressively learn how to develop them in depth.

## Reusable modules

Modules are groups of funcionality that can be integrated with one another to compose bigger applications. A module usually includes: services to backends, GraphQl schemas and resolvers, and patterns and lenses; all of them work together to fetch, create and interpret some kind of entity or data.

You can reuse or adapt _Prtcl-compatible modules in your app and let your users create, branch and reorganize the content from your app as Evees. This is a list of the web-components from the modules that (**will soon be**) available:

   - `GenericPost`: Bundles of text and images, similar to a Tweet or a Facebook post.
   - `SimpleEditor`: Simple editor to write blog-posts or documents that can scale. 
   - `KanbanBoard`: Kanban board to organize cards in columns.
   - `Calendar`: Calendar board to crate and display events.
   - `Drawer`: A drawer to organize and store Evees.

This is how the web components listed above might look like:
<p align="center">
  <img src="https://collectiveone-b1.s3.us-east-2.amazonaws.com/Web/Collage.png?t=1" width="800">
</p>

**`js-uprtcl`** provides you with:

- Bootstrap basic modules to deal with common types of behaviour and data. 
- All the infrastructure needed to develop new modules:
  - Helper services to connect with different service providers (Holochain, Ethereum, IPFS, websockets, etc.)
  - Multiplatform services to interact with those service providers
  - Reusable web-components (lenses) and patterns
