# Patterns

**Patterns** are the fundamental building block of Cortex. It's a basic class, that **recognizes certain types of objects** and **adds behaviour to those objects**.

From the technical point of view, **any class that implements the [`Pattern`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/cortex/src/pattern.ts) interface can be included for Cortex to recognize**:

```ts
/**
 * A pattern is a behaviour that a certain kind of object implements
 */
export interface Pattern {
  recognize: (object: object) => boolean;
}
```

Patterns recognize all the objects which, **when executing the recognize function, return true**.

Here is what a basic pattern looks like:

```ts
import { injectable } from 'inversify';
import { Pattern } from '@uprtcl/cortex';

@injectable()
export class TextPattern implements Pattern {
  recognize(object: any): boolean {
    return (
      typeof object === 'object' && 
      object.text !== undefined && 
      typeof object.text === 'string'
    );
  }
}
```

> Pattern's current implementation is inspired in the trait system of Rust. You could think about patterns as recognizing which struct does an object follow and applying different known traits to it.

## Properties

Patterns can include **properties**: any kind of function to implement different kinds of behaviour. The only condition for the properties to be valid is that **they take as their first argument the object that was successfully recognized**.

This is what a pattern with some properties looks like:

```ts
import { injectable, inject } from 'inversify';
import { html } from 'lit-element';
import { Pattern, HasActions, HasContent } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';
import { ApolloClient } from 'apollo-boost';

@injectable()
export class TextPattern implements Pattern {
  recognize(object: any): boolean {
    return (
      typeof object === 'object' && object.text !== undefined && typeof object.text === 'string'
    );
  }
}

@injectable()
export class TextContent extends TextPattern implements HasContent {
  content = (object: { text: string }): any => {
    return object.text;
  };
}

@injectable()
export class TextActions extends TextPattern implements HasActions {
  // We can inject any registered dependency with the inject annotation from inversify
  constructor(@inject(ApolloClientModule.bindings.Client) client: ApolloClient) {}

  actions = (object: { text: string }): PatternAction[] => {
    return [
      {
        icon: 'alert',
        title: 'Alert with text',
        action: (changeContent: (newContent: any) => void) => {
          alert(object.text);
        }
      }
    ];
  };
}
```

Here, the `TextPattern` is implementing **two properties, `HasLenses` and `HasActions`**. They both receive as their first parameter an object of the type that was recognized. As you can see, different classes can define patterns of behaviour for the same type of object.

This way, **any module can define new properties**, and make them available for other modules to use. In the same way, **any module can define new patterns of behaviour for any kind of object**.

This makes it **trivial to extend behaviour of data defined in other modules**: just add new patterns of behaviour attached to the same recognize function that that module provided.

## Entities

**Entities** are a special case of patterns: they also include a **name**, that **must match the GraphQl Type name** corresponding to the entity that we want to recognize.

For example, to integrate the `TextPattern` we defined in the last section into the `ApolloClient` type system, we can do:

```ts
import { Entity } from '@uprtcl/cortex';

@injectable()
export class TextEntity implements Entity {
  recognize(object: any): boolean {
    return (
      typeof object === 'object' && object.text !== undefined && typeof object.text === 'string'
    );
  }

  name: string = 'Text';
}
```

And then, define a type in our GraphQl type definitions:

```ts
import gql from 'graphql-tag';

export const textTypeDefs = gql`
  type Text implements Entity {
    id: ID!

    text: String!

    _context: EntityContext!
  }
`;
```

For more on how to develop on top of GraphQl and `ApolloClient`, visit [/guides/cortex/building-blocks/graphql-schemas](GraphQl Schemas and Resolvers).
