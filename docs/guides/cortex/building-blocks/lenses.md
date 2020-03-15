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