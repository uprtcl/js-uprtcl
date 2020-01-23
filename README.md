# \_Prtcl web client monorepo

[![CircleCI](https://circleci.com/gh/uprtcl/js-uprtcl/tree/develop.svg?style=shield)](https://circleci.com/gh/uprtcl/js-uprtcl/tree/develop)

> \_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This repo contains a set of tools and libraries to help develop \_Prtcl compatible web-applications.

> Important: these packages are under heavy development, not yet released. Expect breaking changes.

## Packages

### Micro-orchestrator

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_micro_orchestrator.html)

Orchestrates micro modules in one single web application, following the micro-frontend pattern. Manages the dependencies between modules.

### Cortex

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_cortex.html)

Implements the Cortex framework, its building blocks and controllers.

### Multiplatform

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_cortex.html)

Implements services, apollo directives and interfaces that allow your application to consume data from different (de)centralized technologies.

### Lenses

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_lenses.html)

Implements a basic Cortex rendering engine to reinterpret the data together with Cortex patterns.

### GraphQl

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_common.html)

Provides modules to integrate `ApolloClient` in your \_Prtcl applications.

### Redux

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_connections.html)

Provides modules to integrate `redux` in your \_Prtcl applications.

## Providers

These packages provide convenience classes and wrappers around different (de)centralized web technologies so that micro modules can consume them easily.

These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

### Holochain

\_Prtcl provider wrappers around @holochain/hc-web-client.

### Ipfs

\_Prtcl provider wrappers around ipfs-http-client.

### Ethereum

\_Prtcl provider wrappers around web3.

### Http

\_Prtcl provider wrappers around the native `fetch` API.

## Modules

These are application modules compatible with `micro-orchestrator` that define patterns, lenses and services that can work together to create, interpret and share different kind of objects.

### Evees

Implements version control for any kind of content addressable object, with different perspectives (branches in git), and proposals to update those perspectives.

### Evees

Implements documents and folders.

### Wikis

Implements wikis.
