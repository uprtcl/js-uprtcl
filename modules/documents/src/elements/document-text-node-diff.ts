import { LitElement, property, html, css, internalProperty } from 'lit-element';

import { Client, Logger } from '@uprtcl/evees';
import { servicesConnect } from '@uprtcl/evees-ui';

import { TextNode } from '../types';

const LOGINFO = false;

export class TextNodeDiff extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ type: Boolean })
  summary = false;

  @internalProperty()
  client!: Client;

  @internalProperty()
  newData!: TextNode;

  @internalProperty()
  oldData!: TextNode;

  @internalProperty()
  loading = true;

  async firstUpdated() {
    this.logger.log('firstUpdated()', {
      newData: this.newData,
      oldData: this.oldData,
    });
    this.loadChanges();
  }

  async loadChanges() {
    this.loading = true;
    this.loading = false;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    const hasChanges = !this.oldData || this.newData.text !== this.oldData.text;

    return html`
      ${hasChanges
        ? html`<evees-diff-row type="edit">
            <div class="versions-container">
              ${this.oldData
                ? html`<div class="document-container old-page">
                    <documents-text-node-editor
                      .init=${this.oldData.text}
                      type=${this.oldData.type}
                      editable="false"
                    ></documents-text-node-editor>
                  </div>`
                : ''}
              <div class="document-container new-page">
                <documents-text-node-editor
                  .init=${this.newData.text}
                  type=${this.oldData.type}
                  editable="false"
                ></documents-text-node-editor>
              </div>
            </div>
          </evees-diff-row> `
        : ''}
    `;
  }

  static get styles() {
    return css`
      :host {
        text-align: left;
      }
      .document-container {
        border-radius: 3px;
        width: 100;
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
