import { LitElement, property, html } from 'lit-element';
import { LensElement } from '@uprtcl/cortex';
import { TextNode, TextType } from '../types';

export class TextNodeLens extends LitElement implements LensElement<TextNode> {
  @property({ type: Object })
  data: TextNode;

  render() {
    return html`
      ${this.data.type === TextType.Paragraph
        ? html`
            <div contenteditable="true">${this.data.text}</div>
          `
        : html`
            <h4 contenteditable="true">${this.data.text}</h4>
          `}
      ${this.data.links.map(
        link => html`
          <pattern-renderer .hash=${link}></pattern-renderer>
        `
      )}
    `;
  }
}
