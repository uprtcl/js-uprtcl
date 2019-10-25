import { LitElement, html, property, css } from 'lit-element';
import { Node } from '../../patterns/defaults/default-node.pattern';
import { LensElement } from '../../types';

export class NodeList extends LitElement implements LensElement<Node> {
  @property({ type: Object })
  data!: Node;

  @property({ type: Boolean })
  editable: boolean = true;

  get styles() {
    return css`
      .column {
        display: flex;
        flex-direction: column;
      }
    `;
  }

  render() {
    return html`
      <div class="column">
        <slot></slot>

        ${this.data.links.map(
          link => html`
            <pattern-renderer .hash=${link}></pattern-renderer>
          `
        )}
      </div>
    `;
  }
}
