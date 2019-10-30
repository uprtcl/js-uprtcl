import { LitElement, property, html } from 'lit-element';

import { LensElement } from '@uprtcl/cortex';

import { TextNode, TextType } from '../types';

export class TextNodeLens extends LitElement implements LensElement<TextNode> {
  @property({ type: Object })
  data!: TextNode;

  @property()
  editable!: boolean;

  render() {
    return html`
      <node-list .data=${this.data}>
        ${this.data.type === TextType.Paragraph
          ? html`
              <div
                contenteditable=${this.editable ? 'true' : 'false'}
                @input=${e => e.target && this.updateContent(e.target['innerText'])}
              >
                ${this.data.text}
              </div>
            `
          : html`
              <h3
                contenteditable=${this.editable ? 'true' : 'false'}
                @input=${e => e.target && this.updateContent(e.target['innerText'])}
              >
                ${this.data.text}
              </h3>
            `}
      </node-list>
    `;
  }

  updateContent(content: string) {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: { newContent: { ...this.data, text: content } },
        bubbles: true,
        composed: true
      })
    );
  }
}
