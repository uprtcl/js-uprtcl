import { LitElement, property, html } from 'lit-element';
import { LensElement } from '@uprtcl/cortex';
import { TextNode, TextType } from '../types';
import { TextNodePattern } from '../patterns/text-node.pattern';

export class TextNodeLens extends LitElement implements LensElement<TextNode> {
  @property({ type: Object })
  data!: TextNode;

  render() {
    return html`
      <node-list .data=${this.data}>
        ${this.data.type === TextType.Paragraph
          ? html`
              <div
                contenteditable="true"
                @input=${(e: InputEvent) => e.target && this.updateContent(e.target['innerText'])}
              >
                ${this.data.text}
              </div>
            `
          : html`
              <h4
                contenteditable="true"
                @input=${(e: InputEvent) => e.target && this.updateContent(e.target['innerText'])}
              >
                ${this.data.text}
              </h4>
            `}
      </node-list>
    `;
  }

  updateContent(content: string) {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: { newContent: { ...this.data, text: content } }
      })
    );
  }
}
