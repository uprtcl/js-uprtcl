import { LitElement, property, html } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import '@material/mwc-drawer';
import '@material/mwc-top-app-bar';
import '@material/mwc-ripple';

import {
  CREATE_COMMIT,
  CREATE_PERSPECTIVE,
  UPDATE_HEAD,
  RemoteMap,
  EveesModule,
  EveesRemote
} from '@uprtcl/evees';
import { TextType, CREATE_TEXT_NODE, DocumentsModule, htmlToText } from '@uprtcl/documents';
import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';

import { Wiki } from '../types';
import { CREATE_WIKI } from '../graphql/queries';
import { Entity } from '@uprtcl/cortex';
import { Source } from '@uprtcl/multiplatform';

export class WikiDrawer extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-DRAWER');

  @property({ type: String, attribute: 'wiki-id' })
  wikiId!: string;

  @property({ type: Object })
  wiki: Wiki | undefined = undefined;

  @property({ type: Boolean })
  editable: boolean = true;

  currentHead: string | undefined = undefined;
  perspectiveOrigin: string | undefined = undefined;

  @property({ type: String })
  selectedPageHash: string | undefined = undefined;

  @property({ type: String })
  pagesList: Array<{ title: string; id: string }> | undefined = undefined;

  async createPage() {
    if (!this.wiki) return;

    this.pagesList = undefined;

    const remoteMap: RemoteMap = this.request(EveesModule.bindings.RemoteMap);
    const remotes: EveesRemote[] = this.requestAll(EveesModule.bindings.EveesRemote);

    const textNodeEntity: Entity[] = this.requestAll(DocumentsModule.bindings.TextNodeEntity);
    const name = textNodeEntity[0].name;

    const wikiEntity: Entity[] = this.requestAll(DocumentsModule.bindings.TextNodeEntity);
    const wikiName = wikiEntity[0].name;

    const remote: EveesRemote | undefined = remotes.find(
      r => r.authority === this.perspectiveOrigin
    );

    if (!remote)
      throw new Error(`Evees remote not registered for authority ${this.perspectiveOrigin}`);

    const textNodeSource: Source = remoteMap(this.perspectiveOrigin, name);
    const wikiSource: Source = remoteMap(this.perspectiveOrigin, wikiName);

    const pageContent = {
      text: '<h1>New page</h1>',
      type: TextType.Title,
      links: []
    };

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.mutate({
      mutation: CREATE_TEXT_NODE,
      variables: {
        content: pageContent,
        source: textNodeSource.source
      }
    });

    const commit = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: result.data.createTextNode.id,
        parentsIds: [],
        source: remote.source
      }
    });

    const perspective = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        headId: commit.data.createCommit.id,
        authority: remote.authority
      }
    });

    const wiki: Wiki = {
      title: this.wiki.title,
      pages: [...this.wiki.pages, perspective.data.createPerspective.id]
    };

    const wikiResult = await client.mutate({
      mutation: CREATE_WIKI,
      variables: {
        content: wiki,
        source: wikiSource.source
      }
    });

    const wikiCommit = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: wikiResult.data.createWiki.id,
        parentsIds: this.currentHead ? [this.currentHead] : [],
        source: remote.source
      }
    });

    const updateHeadResult = await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.wikiId,
        headId: wikiCommit.data.createCommit.id
      }
    });

    this.loadWiki();
  }

  firstUpdated() {
    this.loadWiki();
  }

  async loadWiki() {
    this.wiki = undefined;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    const result = await client.query({
      query: gql`
      {
        entity(id: "${this.wikiId}") {
          id
          ... on Perspective {
            payload {
              origin
            }
            head {
              id
              data {
                id
                ... on Wiki {
                  title
                  pages {
                    id
                    _context {
                      patterns {
                        content {
                          id
                          _context {
                            patterns {
                              title
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`
    });

    const wiki = result.data.entity.head.data;
    this.editable = result.data.entity._context.patterns.accessControl.canWrite;

    console.log('[WIKI] can write', this.editable);

    this.perspectiveOrigin = result.data.entity.payload.origin;

    const pages = wiki.pages;
    this.pagesList = pages.map(page => ({
      id: page.id,
      title: page._context.patterns.content._context.patterns.title
        ? page._context.patterns.content._context.patterns.title
        : this.t('wikis:untitled')
    }));

    this.wiki = { title: wiki.title, pages: wiki.pages.map(p => p.id) };
    const head = result.data.entity.head;
    this.currentHead = head ? head.id : undefined;
  }

  static get styles() {
    return sharedStyles;
  }

  selectPage(pageHash: string | undefined) {
    this.dispatchEvent(
      new CustomEvent('page-selected', {
        detail: {
          pageId: pageHash
        }
      })
    );

    this.selectedPageHash = pageHash;
  }

  renderPageList() {
    if (!this.pagesList)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    if (this.pagesList.length === 0)
      return html`
        <div class="row center-content" style="flex: 1; align-items: start; padding-top: 24px;">
          <span>${this.t('wikis:no-pages-yet')}</span>
        </div>
      `;

    return html`
      <mwc-list>
        ${this.pagesList.map(page => {
          let text = htmlToText(page.title);
          return html`
            <mwc-list-item @click=${() => this.selectPage(page.id)}>
              ${text}
            </mwc-list-item>
          `;
        })}
      </mwc-list>
    `;
  }

  render() {
    if (!this.wiki)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    return html`
      <mwc-drawer hasHeader>
        <span slot="title" @click=${() => this.selectPage(undefined)} style="cursor: pointer;">
          ${this.wiki.title}
        </span>

        <div class="column" style="height: 100%;">
          <div style="flex: 1;">
            ${this.renderPageList()}
          </div>

          ${this.editable
            ? html`
                <div class="row">
                  <mwc-button
                    raised
                    icon="note_add"
                    @click=${() => this.createPage()}
                    style="flex: 1;"
                  >
                    ${this.t('wikis:new-page')}
                  </mwc-button>
                </div>
              `
            : html``}
        </div>

        <div slot="appContent" class="fill-content" style="display: flex;">
          ${this.selectedPageHash
            ? html`
                <wiki-page .pageHash=${this.selectedPageHash}></wiki-page>
              `
            : html`
                <wiki-home .wikiHash=${this.wikiId} .title=${this.title}></wiki-home>
              `}
        </div>
      </mwc-drawer>
    `;
  }
}
