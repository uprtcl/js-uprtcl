# Lenses

Lenses **are just [custom elements](https://developers.google.com/web/fundamentals/web-components/customelements) that know how to render an entity** recognized with Cortex.

To add a lens to our pattern recognition engine, implement the `HasLens` property in a pattern:

```ts
import { Pattern } from '@uprtcl/cortex';
import { HasLenses } from '@uprtcl/lenses';

@injectable()
export class TextPattern implements Pattern {
  recognize(object: any): boolean {
    return (
      typeof object === 'object' && object.text !== undefined && typeof object.text === 'string'
    );
  }
}

@injectable()
export class TextLenses extends TextPattern implements HasLenses {
  lenses = (object: { text: string }): Lens[] => {
    return [
      {
        name: 'Simple span lens',
        type: 'content',
        render: () => {
          return html`
            <text-lens-element .text=${object.text}></text-lens-element>
          `;
        }
      }
    ];
  };
}
```

Where `<text-lens-element></text-lens-element>` is defined like this:

```ts
import { LitElement, html } from 'lit-element';

export class TextLensElement extends LitElement {
  @property()
  text: string;

  render() {
    return html`
      <span>This is my text: ${this.text}</span>
    `;
  }
}
```

For now, all lenses are defined using [LitElement](https://lit-element.polymer-project.org/), but other frameworks that register custom elements can be sued as well.

We now need to define a `MicroModule` that groups our patterns and our elements, because the lens pattern assumes that there is a `<text-lens-element></text-lens-element>` registered in the `customElements` registry. Go to [Registering a pattern to be recognized](/guides/cortex/loading-cortex.html#registering-a-pattern-to-be-recognized) to see an example.

## Requesting dependencies from a customElement

To request dependencies from within a custom element, you can use the [`moduleConnect`](https://github.com/uprtcl/js-uprtcl/blob/develop/packages/micro-orchestrator/src/elements/module-connect.mixin.ts), which will provide the `request()` method from inside your element to get any dependency registered in the inversify `container`.

```ts
import { LitElement, html } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

export class TextLens extends moduleConnect(LitElement) {
  apolloClient: ApolloClient;

  @property()
  entityId: string;

  @property()
  content: string;

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
      `
    });

    this.content = result.data.entity._context.patterns.content;
  }

  render() {
    if (!this.content) {
      return html`<span>Loading...</span>`;
    }

    return html`
      <span>${this.content}</span>
    `;
  }
}
```

## <cortex-entity>

There is a special custom element defined in [`@uprtcl/lenses`](https://uprtcl.github.io/js-uprtcl/modules/packages/uprtcl-lenses.html): `<cortex-entity>`.

This element takes as an input a `hash` value, and is able to:

1. **Fetch the object** identified with the given hash from the registered `Sources`.
2. **Recognize which patterns** does the object implement, and in particular which `lenses` are registered.
3. Picks and **renders a lens** to display the given object.

In practice, this makes `<cortex-entity>` a dynamic rendering engine, in which the instantiator of the element doesn't need to now anything about the entity they want to render other than its hash.

> In the future, as new ways of referencing objects appear, this may change. Eg, you may need to include the source identifier for `<cortex-entity>` to be able to fetch the object.
