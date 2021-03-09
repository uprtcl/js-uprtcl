import { css, html } from 'lit-element';
import { EveesBaseEditable } from '@uprtcl/evees';
import { TextNode } from '../types';

/** a document editor that has one official version and one draft for the logged user */
export class EditableDocumentEditor extends EveesBaseEditable<TextNode> {
  render() {
    if (this.loading) return html`<uprtcl-loading></uprtcl-loading>`;

    return html`<div class="info-container">${this.renderInfo()}</div>
      <documents-editor uref=${this.uref}></documents-editor>`;
  }

  static get styles() {
    return super.styles.concat([
      css`
        :host {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .infocontainer {
          flex: 0 0 auto;
        }
        documents-editor {
          flex: 1 0 auto;
        }
      `,
    ]);
  }
}
