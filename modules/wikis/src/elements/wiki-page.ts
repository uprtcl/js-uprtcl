import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { sharedStyles } from '@uprtcl/lenses';
import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import {
  ContentUpdatedEvent,
  CONTENT_UPDATED_TAG,
  EveesConfig,
  EveesHelpers,
  EveesModule
} from '@uprtcl/evees';

export class WikiPage extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-PAGE');

  @property({ type: String })
  pageHash!: string;

  @property({ type: String, attribute: 'official-owner' })
  officialOwner!: string;

  @property({ type: String })
  color!: string;

  @property({ type: String })
  wikiId!: string;

  @property({ attribute: false })
  editable: boolean = false;

  @property({ attribute: false })
  loading: boolean = true;

  protected client!: ApolloClient<any>;

  back() {
    this.dispatchEvent(new CustomEvent('nav-back'));
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(CONTENT_UPDATED_TAG, ((e: ContentUpdatedEvent) => {
      this.logger.info('CATCHED EVENT: content-updated ', {
        pageHash: this.pageHash,
        e
      });
      if (e.detail.uref === this.pageHash) {
        this.dispatchEvent(
          new CustomEvent('page-title-changed', {
            detail: { pageId: e.detail.uref }
          })
        );
      }
    }) as EventListener);
  }

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.load();
  }

  async load() {
    this.loading = true;
    this.loading = false;
  }

  render() {
    if (this.loading)
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;

    return html`
      <div class="page-content">
        <documents-editor
          id="doc-editor"
          .client=${this.client}
          uref=${this.pageHash}
          parent-id=${this.wikiId}
          color=${this.color}
          official-owner=${this.officialOwner}
          show-info
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
        .text-editor {
          padding: 0vw 0vw;
        }
      `
    ];
  }
}
