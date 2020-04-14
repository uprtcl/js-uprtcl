# Lenses

Lenses **are just [custom elements](https://developers.google.com/web/fundamentals/web-components/customelements) that know how to render a pattern** recognized with Cortex.

To add a lens to our pattern recognition engine, implement the `HasLens` property in a pattern:

```ts
import { Pattern } from '@uprtcl/cortex';
import { HasLenses } from '@uprtcl/lenses';

export interface Text {
  text: string;
}

export class TextPattern extends Pattern<Text> {
  recognize(object: any): boolean {
    return (
      typeof object === 'object' && 
      object.text !== undefined && 
      typeof object.text === 'string'
    );
  }

  type: string | undefined = undefined;
}

@injectable()
export class TextLenses implements HasLenses<Text> {
  lenses = (object: Text): Lens[] => {
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

After this lens is registered, it will be used by [`<cortex-entity>`](/guides/using-the-evees-module.html#using-cortex-entity) to render entities that this pattern is able to recognize.

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
