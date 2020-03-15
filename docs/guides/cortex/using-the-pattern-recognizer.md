# Using the Pattern Recognizer

Until now, we have seen how to create patterns and integrate them inside the `ApolloClient` infrastructure to be able to resolve through entities. But, **we can also use the pattern recognizing features of Cortex manually, through the `PatternRecognizer`**.

## Manual usage

The [`PatternRecognizer`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/cortex/src/recognizer/pattern.recognizer.ts) is a small class that contains all `Patterns` registered with all the `MicroModules`. It then **exposes a `recognize(object: any): Pattern[]` function that returns all the patterns that recognize any given object**.

You can request it from anywhere, and use it:

```ts
import { PatternRecognizer, CortexModule, Pattern } from '@uprtcl/cortex';

@injectable()
export class TestService {
  constructor(@inject(CortexModule.bindings.Recognizer) recognizer: PatternRecognizer) {}

  async getAllLinksLinks(object: any): Promise<string[][]> {
    const patterns: Pattern[] = this.recognizer.recognizer(object);
    const linksPatterns = patterns.filter(p => p.links);

    return linksPatterns.map(p => p.links(object));
  }
}
```

Remember! Any function you execute when recognizing an object expects as its first parameter the recognized object.

## Recognizing patterns from a GraphQl query

Pattern recognizing is **natively integrated** with our GraphQl infrastructure.

- You can add new properties to the `Patterns` type:

```ts
import gql from 'graphql-tag';

export const typeDef = gql`
  extend type Patterns {
    content: String
  }
`;
```

Make the fields return type optional, since you cannot force all entities present in your application to implement each pattern of behaviour.

- You can request patterns of behaviour with a GraphQl query:

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

          _context {
              patterns {
                content
              }
            }
          }
        }
      }
      `
    });

    this.content = result.data.entity._context.patterns.content;
  }

  render() {
    // ... render the retrieved data
  }
}
```
