import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';

import { TextNode } from '../types';

const LOGINFO = true;

export class TextNodeDiff extends moduleConnect(LitElement) {

  logger = new Logger('EVEES-DIFF');

  @property({ attribute: false })
  newData?: Hashed<TextNode>;

  @property({ attribute: false })
  oldData?: Hashed<TextNode>;

  async firstUpdated() {
    this.logger.log('firstUpdated()', { newData: this.newData, oldData: this.oldData });
  }

  render() {
    if (this.newData === undefined || this.oldData === undefined) {
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;
    }

    return html`
      <div>${this.newData.id} - ${this.newData.object.text}</div>
      <div>${this.oldData.id} - ${this.oldData.object.text}</div>
    `;
  }

  static get styles() {
    return css``;
  }
}
