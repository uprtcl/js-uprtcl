# \_Prtcl infrastructure monorepo

[![](https://img.shields.io/npm/v/@uprtcl/micro-orchestrator)](https://www.npmjs.com/package/@uprtcl/micro-orchestrator)

[![CircleCI](https://circleci.com/gh/uprtcl/js-uprtcl/tree/develop.svg?style=shield)](https://circleci.com/gh/uprtcl/js-uprtcl/tree/develop)

This repo contains a set of tools and libraries to help develop \_Prtcl compatible web-applications.

> Important: these packages are under heavy development, with alpha release. Expect breaking changes.

## Documentation

To learn about \_Prtcl and how to use the packages in this repository, visit our [specification](https://github.com/uprtcl/spec) and our [documentation site](https://uprtcl.github.io/js-uprtcl) (it's WIP, so contribution and feedback are much appreciated).

## Setup for development

### Usage

Clone the project, and run:

```bash
npm install
npm run bootstrap
```

### Build all packages

To build all packages, run:

```bash
npm run build
```

### Run tests

To run the tests from all packages, run:

```bash
npm test
```

### Run demo

To run the demo from `demo/simple-editor`:

1. Run the [ethereum provider](https://github.com/uprtcl/eth-uprtcl) in the background.
2. Run the [http provider](https://github.com/uprtcl/js-uprtcl-server) in the background.
3. Run `npm run dev` in the root folder of this repository.

And go to http://localhost:8080. Refer to [simple-editor](https://github.com/uprtcl/js-uprtcl/tree/develop/demos/simple-editor) for more advanced instructions.

## Packages

### [Micro-orchestrator](https://github.com/uprtcl/js-uprtcl/tree/master/packages/micro-orchestrator)

Orchestrates micro modules in one single web application, following the micro-frontend pattern. Manages the dependencies between modules.

### [Cortex](https://github.com/uprtcl/js-uprtcl/tree/master/packages/cortex)

Base modules that make up the Cortex framework, its building blocks and controllers.

### [Multiplatform](https://github.com/uprtcl/js-uprtcl/tree/master/packages/multiplatform)

Implements services, apollo directives and interfaces that allow your application to consume data from different (de)centralized technologies.

### [Lenses](https://github.com/uprtcl/js-uprtcl/tree/master/packages/lenses)

Implements a basic Cortex rendering engine to reinterpret the data together with Cortex patterns.

### [GraphQl](https://github.com/uprtcl/js-uprtcl/tree/master/packages/graphql)

Provides modules to integrate `ApolloClient` in your \_Prtcl applications.

### [Redux](https://github.com/uprtcl/js-uprtcl/tree/master/packages/redux)

Provides modules to integrate `redux` in your \_Prtcl applications.

## Providers

These packages provide convenience classes and wrappers around different (de)centralized web technologies so that micro modules can consume them easily.

These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

### [Holochain](https://github.com/uprtcl/js-uprtcl/tree/master/providers/holochain)

\_Prtcl provider wrappers around @holochain/hc-web-client.

### [Ipfs](https://github.com/uprtcl/js-uprtcl/tree/master/providers/ipfs)

\_Prtcl provider wrappers around ipfs-http-client.

### [Ethereum](https://github.com/uprtcl/js-uprtcl/tree/master/providers/ethereum)

\_Prtcl provider wrappers around web3.

### [Http](https://github.com/uprtcl/js-uprtcl/tree/master/providers/http)

\_Prtcl provider wrappers around the native `fetch` API.

## Modules

These are application modules compatible with `micro-orchestrator` that define patterns, lenses and services that can work together to create, interpret and share different kind of objects.

### [Evees](https://github.com/uprtcl/js-uprtcl/tree/master/modules/evees)

Implements version control for any kind of content addressable object, with different perspectives (branches in git), and proposals to update those perspectives.

### [Documents](https://github.com/uprtcl/js-uprtcl/tree/master/modules/documents)

Implements documents and folders that can be updated with evees and rendered with cortex.

### [Wikis](https://github.com/uprtcl/js-uprtcl/tree/master/modules/wikis)

Implements wikis that can be updated with evees and rendered with cortex.
