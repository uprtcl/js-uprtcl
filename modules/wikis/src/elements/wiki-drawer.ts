import { LitElement, property, html } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import '@material/mwc-drawer';
import '@material/mwc-top-app-bar';
import '@material/mwc-ripple';

import { CREATE_COMMIT, CREATE_PERSPECTIVE, UPDATE_HEAD } from '@uprtcl/evees';
import { TextType, CREATE_TEXT_NODE } from '@uprtcl/documents';
import { Hashed } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';

import { Wiki } from '../types';
import { CREATE_WIKI } from '../graphql/queries';

export class WikiDrawer extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'wiki-id' })
  wikiId!: string;

  @property({ type: String, attribute: 'current-page' })
  pageId!: string;

  @property({ type: Object })
  wiki: Wiki | undefined = undefined;

  @property({ type: Boolean })
  editable: boolean = true;

  currentHead: string | undefined = undefined;

  @property({ type: String })
  selectedPageHash: string | undefined = undefined;

  @property({ type: String })
  pagesList: Array<{ title: string; id: string }> | undefined = undefined;

  async createPage() {
    if (!this.wiki) return;

    const pageContent = {
      text: 'New page',
      type: TextType.Paragraph,
      links: []
    };

    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);
    const result = await client.mutate({
      mutation: CREATE_TEXT_NODE,
      variables: {
        content: pageContent
      }
    });

    const commit = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: result.data.createTextNode.id,
        parentsIds: []
      }
    });

    const perspective = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        headId: commit.data.createCommit.id
      }
    });

    const wiki: Wiki = {
      title: this.wiki.title,
      pages: [...this.wiki.pages, perspective.data.createPerspective.id]
    };

    const wikiResult = await client.mutate({
      mutation: CREATE_WIKI,
      variables: {
        content: wiki
      }
    });

    const wikiCommit = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: wikiResult.data.createWiki.id,
        parentsIds: this.currentHead ? [this.currentHead] : []
      }
    });

    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.wikiId,
        headId: wikiCommit.data.createCommit.id
      }
    });

    console.log(this.selectedPageHash)
  }

  firstUpdated() {
    if (this.pageId) {
      this.selectedPageHash  = this.pageId;
    }
    this.loadWiki();
  }

  async loadWiki() {
    this.wiki = undefined;

    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);

    const result = await client.query({
      query: gql`
      {
        entity(id: "${this.wikiId}") {
          id

          ... on Perspective {
            head {
              id
            }
          }

          _patterns {
            content {
              id
              ... on Wiki {
                title
                pages {
                  id
                  _patterns {
                    content {
                      id
                      _patterns {
                        title
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

    const { pages } = result.data.entity._patterns.content;
    this.pagesList = pages.map(page => ({
      id: page.id,
      title: page._patterns.content._patterns.title
        ? page._patterns.content._patterns.title
        : this.t('wikis:untitled')
    }));

    const content = result.data.entity._patterns.content;
    this.wiki = { title: content.title, pages: content.pages.map(p => p.id) };
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
        ${this.pagesList.map(
          page => html`
            <mwc-list-item @click=${() => this.selectPage(page.id)}>
              ${page.title}
            </mwc-list-item>
          `
        )}
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
