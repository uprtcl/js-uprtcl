# GraphQl Schemas and Resolvers

The [`ApolloClientModule`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/graphql/src/apollo-client.module.ts) is a **very basic module** in respect to all the infrastructure. This is because the **[vision of cortex](/guides/cortex/what-is-cortex.html#vision) can benefit largely of leaning on `GraphQl`**, as a way to express queries and navigate linked graph of objects.

## Extending the base schema

**Each `MicroModule` can extend the [base GraphQl schema](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/graphql/src/base-schema.ts)**, declaring new types and mutations, and defining its own resolvers.

This enables various methods of interoperability. For example, **modules can query the entire graph of data and entities** that all its dependencies have registered.

To extend the base schema, follow this steps:

1. Define your GraphQl type definitions and resolvers for those types:

```ts
import gql from 'graphl-tag';
import { TextProvider } from '../text-provider';
import { TextModule } from '../text-module';

export const typeDefs = gql`
  type Text implements Entity {
    id: ID!

    text: String!
    reference: Entity! @discover

    _context: EntityContext!
  }

  extend type Mutation {
    setHomeText(homeText: String!): Text! @discover
  }
`;

export const resolvers = {
  Mutation: {
    async setHomeText(_, { homeText }, { container }) {
      // Here we have access to the container, and we can get any registered dependencies
      const provider: TextProvider = container.get(TextModule.bindings.TextProvider);

      const hash = provider.setHomeText(homeText);
      return hash;
    }
  }
};
```

Some comments:

- For every type of content-addressable entity that you want to register, create a GraphQl type that implements the `Entity` type:

```
interface Entity {
  id: ID!

  _context: EntityContext!
}
```

You don't need to implement resolvers for either `id` or `_context`, as they are set by the `CortexModule`.

2. **Create and load a `GraphQlSchemaModule`** with your type definitions and resolvers:

```ts
import { GraphQlSchemaModule } from '@uprtcl/graphql';
import { typeDefs, resolvers } from './graphql';

const schemaModule = new GraphQlSchemaModule(typeDefs, resolvers);

// ... MicroOrchestrator initialization and loading of base modules

await orchestrator.loadModule(schemaModule);
```

## The `@discover` directive

The [`@uprtcl/multiplatform`](/modules/packages/uprtcl-multiplatform.html) registers the [`@discover`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/multiplatform/src/graphql/directives/discover-directive.ts) directive.

This directive, when declared in a field inside a GraphQl schema, allows for references to content-addressable to be resolved, and for GraphQl queries to traverse the linked graph of content-addressable entities, between different platforms.

For example, in the schema we defined earlier:

```ts
export const typeDefs = gql`
  type Text implements Entity {
    id: ID!

    text: String!
    reference: Entity! @discover

    _context: EntityContext!
  }

  extend type Mutation {
    setHomeText(homeText: String!): Text! @discover
  }
`;
```

The `@discover` directive allows for `GraphQl` queries to traverse the graph of linked entities, by getting the hash of the reference, fetching the referenced entity and retrieving all its contents.

To make the `@discover` directive work, it requires you to **provide the hash of the referenced object**:

- If the field of the entity already contains the hash of the object, **do nothing**.
- If the field of the entity does not contain the hash of the object, **create a custom resolver to return the hash of the referenced entity**.

All this enables elements to make queries of this form:

```ts
import { LitElement, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

export class TextLens extends moduleConnect(LitElement) {
  apolloClient: ApolloClient;

  @property()
  entityId: string;

  firstUpdated() {
    this.apolloClient = this.request(ApolloClientModule.bindings.Client);
    this.loadData();
  }

  async loadData() {
    const result = await this.apolloClient.query({
      query: gql`
      {
        entity(hash: ${this.entityId}) {
          id
          
          ... on Text {
            text
            reference {
              id

              ... on Text {
                text
                reference {
                  id

                  ... on Text {
                    text
                  }
                }

              }
            }

          }
        }
      }
      `
    });

    this.lastText = result.data.entity.reference.reference.text;
  }

  render() {
    // ... render the retrieved data
  }
}
```

This is, of course, provided that all the `reference` fields inside all `Text` object we retrieve contain hashes that point to other `Text` entities. But there is no restriction, in the sense that any `reference` field could contain a hash that would point to any other kind of `Entity`.