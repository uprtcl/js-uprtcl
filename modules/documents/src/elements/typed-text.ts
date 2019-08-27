import { LitElement, property, html } from 'lit-element';
import { LensElement } from '@uprtcl/lenses';
import { TypedText } from '../types';

export class TypedTextElement extends LitElement implements LensElement<TypedText> {

  @property()
  data: TypedText;

  render() {
    return html`
      <div contenteditable>${this.data.text}</div>
    `;
  }

}
