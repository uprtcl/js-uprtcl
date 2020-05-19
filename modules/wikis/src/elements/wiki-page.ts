import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, (matches) => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { TextNode } from '@uprtcl/documents';
import { sharedStyles } from '@uprtcl/lenses';
import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ContentUpdatedEvent, CONTENT_UPDATED_TAG } from '@uprtcl/evees';

import '@material/mwc-top-app-bar';

export class WikiPage extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-PAGE');

  @property({ type: String })
  pageHash!: string;

  @property({ type: Object })
  textNode!: TextNode;

  @property({ type: String })
  color!: string;

  protected client!: ApolloClient<any>;

  back() {
    this.dispatchEvent(new CustomEvent('nav-back'));
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(CONTENT_UPDATED_TAG, ((e: ContentUpdatedEvent) => {
      this.logger.info('CATCHED EVENT: content-updated ', { pageHash: this.pageHash, e });
      e.stopPropagation();
      this.dispatchEvent(
        new CustomEvent('page-title-changed', { detail: { pageId: e.detail.ref } })
      );
    }) as EventListener);
  }

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  async load() {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${this.pageHash}") {
          id
          ... on Perspective {
            head {
              id
              data {
                id
                ... on TextNode {
                  text
                  links
                }
              }
            }
          }

        }
      }`,
    });

    this.textNode = result.data.entity.head.data;
  }

  render() {
    if (!this.textNode) return html` <cortex-loading-placeholder></cortex-loading-placeholder> `;

    return html`
      <div class="top-row">
        <mwc-icon-button icon="arrow_back_ios" @click=${this.back}></mwc-icon-button>
      </div>

      <div class="page-content">
        <documents-editor
          id="doc-editor"
          @doc-changed=${(e) => this.onDocChanged(e)}
          .client=${this.client}
          ref=${this.pageHash}
          color=${this.color}
        >
        </documents-editor>
      </div>
    `;
  }

  // Propagate the event to upstream components
  private onDocChanged(e: CustomEvent) {
    let event = new CustomEvent('doc-changed', {
      detail: {
        docChanged: e.detail.docChanged,
      },
    });
    this.dispatchEvent(event);
  }

  async pushDocument() {
    if (this.shadowRoot) {
      const el: any = this.shadowRoot.getElementById('doc-editor');
      return el.persistAll();
    }

    return Promise.resolve();
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          width: 100%;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .page-content {
          margin: 0 auto;
          max-width: 900px;
          width: 100%;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .top-row {
          margin: 16px 0px 2vw 1.5vw;
        }
        .text-editor {
          padding: 0vw 0vw;
        }
        @media (max-width: 768px) {
          .top-row {
            display: none;
          }
        }
      `,
    ];
  }
}
