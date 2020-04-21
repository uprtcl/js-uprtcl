# Patterns

**Patterns** are the fundamental building block of Cortex. It's a basic class, that **recognizes certain types of objects** and **adds behaviour to those objects**.

From the technical point of view, **any class that extends the [`Pattern`](https://github.com/uprtcl/js-uprtcl/blob/master/packages/cortex/src/types/pattern.ts) class can be included for Cortex to recognize**:

```ts
/**
 * A pattern is a behaviour that a certain kind of object implements
 */
export class Pattern<T> {
  recognize: (object: object) => boolean;

  // Name of the type for this pattern
  // If given, must match the GraphQl type defined in your schemas
  type: string | undefined;
}
```

Patterns recognize all the objects which, **when executing the recognize function, return true**.

Here is what a basic pattern looks like:

```ts
import { Pattern } from '@uprtcl/cortex';

export interface Text {
  text: string;
}

export class TextPattern extends Pattern<Text> {
  recognize(object: any): boolean {
    return (
      typeof object === 'object' && object.text !== undefined && typeof object.text === 'string'
    );
  }

  type = 'Text';
}
```

> Pattern's current implementation is inspired in the trait system of Rust. You could think about patterns as recognizing which struct does an object follow and applying different known traits to it.

## Behaviours

Patterns can receive **behaviours**: any kind of function to implement different kinds of funcionality. The only condition for the behaviour to be valid is that **they take as their first argument the object that was successfully recognized**.

This is what a behaviour **HasText** looks like:

```ts
import { injectable, inject } from 'inversify';
import { html } from 'lit-element';
import { Pattern, HasActions, HasText } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';
import { ApolloClient } from 'apollo-boost';

export interface Text {
  text: string;
}

export class TextPattern extends Pattern<Text> {
  recognize(object: any): boolean {
    return (
      typeof object === 'object' && object.text !== undefined && typeof object.text === 'string'
    );
  }

  type: string | undefined = undefined;
}

@injectable()
export class TextContent implements HasText<Text> {
  content = (object: Text): any => {
    return object.text;
  };
}

@injectable()
export class TextActions implements HasActions<Text> {
  // We can inject any registered dependency with the inject annotation from inversify
  constructor(@inject(ApolloClientModule.bindings.Client) client: ApolloClient) {}

  actions = (object: Text): PatternAction[] => {
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

Here, `TextContent` and `TextActions` are implementing **two behaviours, `HasLenses` and `HasActions`**. They both receive as their first parameter an object of the type that was recognized. As you can see, different classes can define different behaviour for the same type patterns.

This way, **any module can define new properties**, and make them available for other modules to use. In the same way, **any module can define new behaviours for any kind of pattern**.

## Registering Patterns with Behaviours

So, we know about _Patterns_ and _Behaviours_. How do we bind them together?

To bind certain _Behaviours_ to a certain _Pattern_, we have to use the **PatternsModule**:

```ts
import { PatternsModule } from '@uprtcl/cortex';
import { TextPattern, TextActions, TextContent } from './text-pattern';

const patternsModule = new PatternsModule([new TextPattern([TextActions, TextContent])]);
```

Here, we are adding the `TextActions` and `TextContent` behaviour to the `TextPattern`. Keep in mind that the `PatternsModule` depends on the base `CorteModule` to already be present.

As with all other `MicroModules`, we have two options available when using the `PatternsModule`:

- Instantiate it directly and load it into the `MicroOrchestrator`:

```ts
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { PatternsModule, CortexModule } from '@uprtcl/cortex';

import { TextPattern, TextActions, TextContent } from './text-pattern';

const textPatterns = new PatternsModule([new TextPattern([TextActions, TextContent])]);

const orchestrator = new MicroOrchestrator();
await orchestrator.loadModules([new CortexModule(), textPatterns]);
```

- Declare it as a `submodule` of one of our `MicroModules`:

```ts
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { PatternsModule } from '@uprtcl/cortex';

import { TextPattern, TextActions, TextContent } from './text-pattern';

export class TextModule extends MicroModule {
  async onLoad(container: interfaces.Container) {}

  get submodules() {
    return [new PatternsModule([new TextPattern([TextActions, TextContent])])];
  }
}
```

Using the `PatternsModule`, our *Patterns* and *Behaviours* get registered and ready to be used with the `PatternRecognizer` service, the GraphQl infrastructure and the `<cortex-entity>` element.

All of this makes it **trivial to extend behaviour of data defined in other modules** by just adding new behaviour classes attached to the same pattern that that module exports.

## Matching GraphQl Types

Your defined Cortex patterns **can match a GraphQl Schema Type**, to make it much easier for you to develop components that kind of entity.

To enable this, the type property in your _Pattern_ must match the name of the GraphQl type:

```ts
export class TextPattern extends Pattern<Text> {
  recognize(object: any): boolean {
    return (
      typeof object === 'object' && object.text !== undefined && typeof object.text === 'string'
    );
  }

  type: string | undefined = 'Text';
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
