# @uprtcl/graphql

[![](https://img.shields.io/npm/v/@uprtcl/graphql)](https://www.npmjs.com/package/@uprtcl/graphql)

These are \_Prtcl `micro-orchestrator` wrapper modules:

- `ApolloClientModule`: basic module that registers the `ApolloClient` to be available to any external modules
- `GraphQlSchemaModule`: building-block module that can extend the basic schema incldued in `ApolloClientModule`, with new type definitions, resolvers or directives. This lets you build whole graphql applications by composing different GraqhQl schema definitions.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/graphql
```

## Usage

Import the `ApolloClientModule` module and load it:

```ts
import { ApolloClientModule } from '@uprtcl/graphql';

const apolloClientModule = new ApolloClientModule(),

await orchestrator.loadModules([apolloClientModule]);
```

### Add a new GraphQl schema to the global `ApolloClient`

In your module, you can declare a `GraphQlSchemaModule` as a submodule and add your schemas, resolvers and directives:

```ts
import { GraphQlSchemaModule } from '@uprtcl/graphql';

import { testTypeDefs } from './typeDefs';
import { resolvers } from './resolvers';

export class TestModule extends MicroModule {
  static id = Symbol('test-module');

  get submodules() {
    return [new GraphQlSchemaModule(documentsTypeDefs, resolvers)];
  }
}
```

And then load your module in the `micro-orchestrator`:

```ts
import { TestModule } from './test-module';

await orchestrator.loadModules([new TestModule()]);
```
