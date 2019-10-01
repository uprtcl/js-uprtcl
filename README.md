# _Prtcl web client monorepo

> Important: these packages are under heavy development, not yet released. Expect breaking changes.

This repo contains a set of tools and libraries to help develop _Prtcl compatible web-applications. 

## Packages

### Micro-orchestrator

Orchestrates micro modules in one single web application, following the micro-frontend pattern. Manages the dependencies between modules.

### Cortex

Implements the Cortex framework, its building blocks and controllers.

### Common

Implements the _Prtcl basic types, patterns and rendering blocks.

### Connections

Optional package containing convencience services and connections to different (de)centralized technologies.

Supported technologies for now: IPFS, ethereum, Holochain, websockets...

## Modules

These are application modules compatible with `micro-orchestrator` that define patterns, lenses and services that can work together to create, interpret and share different kind of objects.

### Documents

Implements documents and folders.
