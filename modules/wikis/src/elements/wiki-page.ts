import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(
      /([A-Z])/g,
      (matches) => `-${matches[0].toLowerCase()}`
    );
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { TextNode } from '@uprtcl/documents';
import { sharedStyles } from '@uprtcl/lenses';
import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import {
  ContentUpdatedEvent,
  CONTENT_UPDATED_TAG,
  EveesHelpers,
  Evees,
  EveesModule,
  EveesRemote,
} from '@uprtcl/evees';

export class WikiPage extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-PAGE');

  @property({ type: String })
  pageHash!: string;

  @property({ type: Object })
  textNode!: TextNode;

  @property({ type: String })
  color!: string;

  @property({ type: Array })
  editableRemotes: string[] = [];

  @property({ attribute: false })
  editable: string = 'false';

  protected client!: ApolloClient<any>;

  back() {
    this.dispatchEvent(new CustomEvent('nav-back'));
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(CONTENT_UPDATED_TAG, ((e: ContentUpdatedEvent) => {
      this.logger.info('CATCHED EVENT: content-updated ', {
        pageHash: this.pageHash,
        e,
      });
      e.stopPropagation();
      this.dispatchEvent(
        new CustomEvent('page-title-changed', {
          detail: { pageId: e.detail.uref },
        })
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
        entity(uref: "${this.pageHash}") {
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

    const remoteId = await EveesHelpers.getPerspectiveRemoteId(
      this.client,
      this.pageHash
    );

    const remote = (this.requestAll(
      EveesModule.bindings.EveesRemote
    ) as EveesRemote[]).find((r) => r.id === remoteId);
    if (!remote) throw new Error(`remote not found ${remoteId}`);
    const canWrite = await remote.canWrite(this.pageHash);

    this.editable =
      this.editableRemotes.length > 0
        ? this.editableRemotes.includes(remoteId)
          ? canWrite
            ? 'true'
            : 'false'
          : 'false'
        : canWrite
        ? 'true'
        : 'false';
  }

  render() {
    if (!this.textNode)
      return html` <cortex-loading-placeholder></cortex-loading-placeholder> `;

    return html`
      <div class="top-row">
        <uprtcl-icon-button
          icon="arrow_back_ios"
          @click=${this.back}
        ></uprtcl-icon-button>
      </div>

      <div class="page-content">
        <documents-editor
          id="doc-editor"
          .client=${this.client}
          uref=${this.pageHash}
          color=${this.color}
          editable=${this.editable}
        >
        </documents-editor>
      </div>
    `;
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
