import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Entity } from '@uprtcl/cortex';
import { EveesWorkspace } from '@uprtcl/evees';

import { TextNode } from '../types';

const LOGINFO = true;

export class TextNodeDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ type: Boolean })
  summary: boolean = false;

  @property({ attribute: false })
  workspace!: EveesWorkspace;

  @property({ attribute: false })
  newData!: Entity<TextNode>;

  @property({ attribute: false })
  oldData!: Entity<TextNode>;

  async firstUpdated() {
    this.logger.log('firstUpdated()', {
      newData: this.newData,
      oldData: this.oldData
    });
  }

  render() {
    if (this.newData === undefined || this.oldData === undefined) {
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    return html`
      <div class="page-edited-title">Updated</div>
      <div class="document-container old-page">
        <documents-editor
          .client=${this.workspace.workspace}
          uref=${this.oldData.id}
          read-only
        ></documents-editor>
      </div>
      <div class="document-container new-page">
        <documents-editor
          .client=${this.workspace.workspace}
          uref=${this.newData.id}
          read-only
        ></documents-editor>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        text-align: left;
      }
      .page-edited-title {
        font-weight: bold;
        margin-bottom: 9px;
        color: gray;
      }
      .document-container {
        padding: 2vw;
        border-radius: 3px;
        margin-bottom: 16px;
      }
      .editor-container {
        border-radius: 3px;
      }
      .new-page {
        background-color: #abdaab;
      }
      .old-page {
        background-color: #dab6ab;
      }
    `;
  }
}
