# @uprtcl/graphql

> \_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)
> /)

These are _Prtcl `micro-orchestrator` wrapper modules: 

* `ApolloClientModule`: basic module that registers the `ApolloClient` to be available to any external modules
* `GraphQlSchemaModule`: building-block module that can extend the basic schema, with new type definitions, resolvers or directives. This lets you build whole graphql applications by composing different GraqhQl schema definitions.

## Install

```bash
npm install @uprtcl/graphql
```

## Usage

Import the `ApolloClientModule` module and load it:

```ts
import {
  ApolloClientModule
} from '@uprtcl/graphql';

const apolloClientModule = new ApolloClientModule(),

await orchestrator.loadModules([apolloClientModule]);
```
