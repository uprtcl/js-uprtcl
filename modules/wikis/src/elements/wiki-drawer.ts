import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import '@material/mwc-drawer';
import '@material/mwc-top-app-bar';

import { EveesTypes } from '@uprtcl/evees';
import { DocumentsTypes } from '@uprtcl/documents';
import { Creatable } from '@uprtcl/cortex';
import { GraphQlTypes } from '@uprtcl/common';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

import { Wiki } from '../types';

export class WikiDrawer extends moduleConnect(LitElement) {
  @property({ type: Object })
  wiki!: Wiki;

  @property({ type: String })
  selectedPageHash!: String;

  @property({ type: String })
  title!: string;

  @property({ type: String })
  pagesList: Array<any> = [];

  //this is going to be changed
  @property({ type: String })
  wikiId: String = window.location.href.split('id=')[1];

  createPage = async () => {
    const isCreatable = p => (p as Creatable<any, any>).create;

    const perspectivePattern: any = this.requestAll(EveesTypes.PerspectivePattern).find(
      isCreatable
    );
    const pagePattern: any = this.requestAll(DocumentsTypes.TextNodeEntity).find(isCreatable);

    const eveesProvider: any = this.requestAll(EveesTypes.EveesRemote).find((provider: any) => {
      const regexp = new RegExp('^http');
      return !regexp.test(provider.uprtclProviderLocator);
    });

    const pagesProvider: any = this.requestAll(DocumentsTypes.DocumentsRemote).find(
      (provider: any) => {
        const regexp = new RegExp('^http');
        return !regexp.test(provider.uprtclProviderLocator);
      }
    );

    const pageHash = await pagePattern.create()(undefined, pagesProvider.uprtclProviderLocator);

    const perspective = await perspectivePattern.create()(
      { dataId: pageHash.id },
      eveesProvider.uprtclProviderLocator
    );

    const pages = [...this.wiki.pages, perspective.id];
    this.updateContent(pages);
  };

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);

    const result = await client.query({
      query: gql`
      {
        getEntity(id: "${this.wikiId}") {
          id
          raw
          content {
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
        }
      }`
    });

    const { pages } = result.data.getEntity.content.entity;
    this.pagesList = pages.map(page => {
      return {
        id: page.id,
        title: page.content.entity.patterns.title ? page.content.entity.patterns.title : 'Unknown'
      };
    });

    this.title = result.data.getEntity.content.entity.title;
  }

  updateContent(pages: Array<string>) {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: { newContent: { ...this.wiki, pages } },
        bubbles: true,
        composed: true
      })
    );
  }

  setPage(pageHash) {
    this.selectedPageHash = pageHash;
  }

  render() {
    return html`
      <mwc-drawer hasHeader>
        <span slot="title">${this.title}</span>

        <div class="aside">
          <ul>
            ${this.pagesList.map(page => {
              return html`
                <li @click=${() => this.setPage(page.id)}>${page.title}</li>
              `;
            })}
          </ul>
          <mwc-button @click=${() => this.createPage()}>
            <mwc-icon>note_add</mwc-icon>
            New page
          </mwc-button>
        </div>

        <div slot="appContent">
          ${this.selectedPageHash
            ? html`
                <wiki-page .pageHash=${this.selectedPageHash}></wiki-page>
              `
            : html`
                <home-page .wikiHash=${this.wikiId} .title=${this.title}></home-page>
              `}
        </div>
      </mwc-drawer>
    `;
  }

  static get styles() {
    return css`
      li {
        word-wrap: break-word;
        margin-bottom: 9px;
        cursor: pointer;
      }

    `;
  }
}
