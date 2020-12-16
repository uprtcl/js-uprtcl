import { LitElement, html, property } from 'lit-element';

export class MockElement extends LitElement {
  @property()
  content!: string;

  render() {
    return html` <span>Mock content: ${this.content}</span> `;
  }
}
