import { property, html, css, LitElement } from 'lit-element';

import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { TextNodeFields } from 'src/types';
import { Hashed } from '@uprtcl/cortex';

export class DocumentTextNodeFields extends moduleConnect(LitElement) {

  logger = new Logger('DOCUMENT-EDITOR');

  @property({ type: String })
  ref: string | undefined = undefined;

  @property({ type: Object, attribute: false})
  data: Hashed<TextNodeFields> | undefined = undefined;

  render() {
    if (!this.data) return html``;
    return html`
      <textarea>${this.data.object.text}</textarea>
    `;
  }

  static get styles() {
    return css`
    `;
  }
}
