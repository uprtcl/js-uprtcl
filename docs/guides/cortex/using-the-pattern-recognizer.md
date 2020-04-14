# Using the Pattern Recognizer

Until now, we have seen how to create patterns and integrate them inside the `ApolloClient` infrastructure to be able to resolve through entities. But, **we can also use the pattern recognizing features of Cortex manually, through the `PatternRecognizer`**.

## Manual usage

The `PatternRecognizer` is a small class that contains all `Patterns` registered with all the `MicroModules` you have loaded in your app. It then **exposes utility functions that return all the patterns and behaviours that recognize any given object**. See the API for the [`PatternRecognizer`](https://github.com/uprtcl/js-uprtcl/blob/master/packages/cortex/src/recognizer/pattern.recognizer.ts) class to see all available functions.

You can request it from anywhere, and use it:

```ts
import { PatternRecognizer, CortexModule, Pattern } from '@uprtcl/cortex';

@injectable()
export class TestService {
  constructor(@inject(CortexModule.bindings.Recognizer) recognizer: PatternRecognizer) {}

  async getAllLinksLinks(object: any): Promise<string[][]> {
    const behaviours: Behaviour<any>[] = this.recognizer.recognizeBehaviours(object);
    const linksBehaviours = behaviours.filter(b => (b as HasLinks).links);

    return linksBehaviours.map(b => b.links(object));
  }
}
```

Remember! **Any function you execute when recognizing an object expects as its first parameter the recognized object**.

## Recognizing patterns from a GraphQl query

Pattern recognizing is **natively integrated** with our GraphQl infrastructure.

- You can add new properties to the `Patterns` type:

```ts
import gql from 'graphql-tag';

export const typeDef = gql`
  extend type Patterns {
    text: String
  }
`;
```

Make the **fields return type optional**, since you cannot force all entities present in your application to implement each pattern of behaviour.

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
              text
            }
          }
        }
      }
      `
    });

    this.text = result.data.entity._context.patterns.text;
  }

  render() {
    // ... render the retrieved data
  }
}
```
