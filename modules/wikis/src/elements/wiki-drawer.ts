import { LitElement, property, html } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import '@material/mwc-drawer';
import '@material/mwc-top-app-bar';
import '@material/mwc-ripple';

import { UpdateContentEvent, EveesModule } from '@uprtcl/evees';
import { DocumentsModule } from '@uprtcl/documents';
import { Creatable, Hashed } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';

import { Wiki } from '../types';
import { Wikis } from '../services/wikis';
import { WikisModule } from '../wikis.module';

export class WikiDrawer extends moduleConnect(LitElement) {
  @property({ type: Object })
  wiki!: Hashed<Wiki>;

  @property({ type: Boolean })
  public editable: boolean = true;

  @property({ type: String })
  selectedPageHash: string | undefined = undefined;

  @property({ type: String })
  pagesList: Array<{ title: string; id: string }> | undefined = undefined;

  createPage = async () => {
    const isCreatable = p => (p as Creatable<any, any>).create;

    const perspectivePattern: any = this.requestAll(EveesModule.types.PerspectivePattern).find(
      isCreatable
    );
    const pagePattern: any = this.requestAll(DocumentsModule.types.TextNodeEntity).find(isCreatable);

    const eveesProvider: any = this.requestAll(EveesModule.types.EveesRemote).find((provider: any) => {
      const regexp = new RegExp('^http');
      return !regexp.test(provider.uprtclProviderLocator);
    });

    const pagesProvider: any = this.requestAll(DocumentsModule.types.DocumentsRemote).find(
      (provider: any) => {
        const regexp = new RegExp('^http');
        return !regexp.test(provider.uprtclProviderLocator);
      }
    );

    const pageHash = await pagePattern.create()(
      { text: 'New page' },
      pagesProvider.uprtclProviderLocator
    );

    const perspective = await perspectivePattern.create()(
      { dataId: pageHash.id },
      eveesProvider.uprtclProviderLocator
    );

    const wiki: Wiki = {
      ...this.wiki.object,
      pages: [...this.wiki.object.pages, perspective.id]
    };

    const { id } = await this.createWiki(wiki);
    this.updateContent(id);
  };

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);

    const result = await client.query({
      query: gql`
      {
        getEntity(id: "${this.wiki.id}") {
          id
          entity {
            ... on Wiki {
              title
              pages {
                id
                content {
                  id
                  patterns {
                    title
                  }
                }
              }
            }
          }
        }
      }`
    });

    const { pages } = result.data.getEntity.entity;
    this.pagesList = pages.map(page => ({
      id: page.id,
      title: page.content.patterns.title ? page.content.patterns.title : this.t('wikis:untitled')
    }));
  }

  createWiki(wiki: Wiki): Promise<Hashed<Wiki>> {
    const wikis: Wikis = this.request(WikisModule.types.Wikis);
    return wikis.createWiki(wiki);
  }

  updateContent(dataId: string) {
    this.dispatchEvent(
      new UpdateContentEvent({
        detail: { dataId },
        bubbles: true,
        composed: true
      })
    );
  }

  static get styles() {
    return sharedStyles;
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
            <mwc-list-item @click=${() => (this.selectedPageHash = page.id)}>
              ${page.title}
            </mwc-list-item>
          `
        )}
      </mwc-list>
    `;
  }

  render() {
    return html`
      <mwc-drawer hasHeader>
        <span
          slot="title"
          @click=${() => (this.selectedPageHash = undefined)}
          style="cursor: pointer;"
        >
          ${this.wiki.object.title}
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
                <wiki-home .wikiHash=${this.wiki.id} .title=${this.title}></wiki-home>
              `}
        </div>
      </mwc-drawer>
    `;
  }
}
