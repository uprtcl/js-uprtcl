# \_Prtcl web client monorepo

[![CircleCI](https://circleci.com/gh/uprtcl/js-uprtcl/tree/develop.svg?style=shield)](https://circleci.com/gh/uprtcl/js-uprtcl/tree/develop)

>_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

This repo contains a set of tools and libraries to help develop \_Prtcl compatible web-applications.

> Important: these packages are under heavy development, not yet released. Expect breaking changes.

## Packages

### Micro-orchestrator

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_micro_orchestrator.html)

Orchestrates micro modules in one single web application, following the micro-frontend pattern. Manages the dependencies between modules.

### Cortex

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_cortex.html)

Implements the Cortex framework, its building blocks and controllers.

### Common

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_common.html)

Implements the \_Prtcl basic types, patterns and rendering blocks.

### Connections

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_connections.html)

Optional package containing convencience services and connections to different (de)centralized technologies.

Supported technologies for now: IPFS, ethereum, Holochain, websockets...

## Modules

These are application modules compatible with `micro-orchestrator` that define patterns, lenses and services that can work together to create, interpret and share different kind of objects.

### Documents

> [Documentation](https://uprtcl.github.io/js-uprtcl/modules/_uprtcl_documents.html)

Implements documents and folders.
