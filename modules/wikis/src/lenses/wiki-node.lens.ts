import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { EveesTypes } from '@uprtcl/evees';
import { DocumentsTypes } from '@uprtcl/documents';
import { Creatable } from '@uprtcl/cortex';
import { GraphQlTypes } from '@uprtcl/common';

import { WikiNode } from '../types';
import { moduleConnect } from '@uprtcl/micro-orchestrator';

export class WikiNodeLens extends moduleConnect(LitElement) {
  @property({ type: Object })
  data!: WikiNode;

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
      return regexp.test(provider.uprtclProviderLocator);
    });

    const pagesProvider: any = this.requestAll(DocumentsTypes.DocumentsRemote).find(
      (provider: any) => {
        const regexp = new RegExp('^http');
        return regexp.test(provider.uprtclProviderLocator);
      }
    );

    const pageHash = await pagePattern.create()(undefined, pagesProvider.uprtclProviderLocator);

    const perspective = await perspectivePattern.create()(
      { dataId: pageHash.id },
      eveesProvider.uprtclProviderLocator
    );

    const pages = [...this.data.pages, perspective.id];
    this.updateContent(pages);
  };

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    const titleQuery = await client.query({
      query: gql`
      {
        getEntity(id: "${this.wikiId}") {
          id
          content {
            entity {
              ... on Wiki {
                title
              }
            }
          }
        }
      }`
    });

    const pagesQuery = await client.query({
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
                    entity {
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
      }`
    });

    const { pages } = pagesQuery.data.getEntity.content.entity
    this.pagesList = pages.map(page => {
      return {
        id: page.id,
        title: page.content.entity.patterns.title ? page.content.entity.patterns.title : 'Unknown'
      }
    });

    this.title = titleQuery.data.getEntity.content.entity.title;
  }

  updateContent(pages: Array<string>) {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: { newContent: { ...this.data, pages } },
        bubbles: true,
        composed: true
      })
    );
  }

  setPage(pageHash) {
    this.selectedPageHash = pageHash;
  }

  wikiHeader() {
    return html`
      <div class="header">
        <div class="wiki-title">
          <h2 style="text-align: center;">${this.title}</h2>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="row">
        <div class="column left" style="background-color:#aaa;">
          ${this.wikiHeader()}
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
        <div class="column right" style="background-color:#bbb;">
          <p>
            ${this.selectedPageHash
              ? html`
                  <wiki-page .pageHash=${this.selectedPageHash}></wiki-page>
                `
              : html`
                  <home-page .wikiHash=${this.wikiId} .title=${this.title}></home-page>
                `}
          </p>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      * {
        box-sizing: border-box;
      }
      li {
        word-wrap: break-word;
        margin-bottom: 9px;
        cursor: pointer;
      }
      .column {
        float: left;
        padding: 10px;
        height: 100vh; /* Should be removed. Only for demonstration */
      }
      .left {
        width: 25%;
      }
      .right {
        width: 75%;
      }
      .row:after {
        content: '';
        display: table;
        clear: both;
      }
      .header {
        display: flex;
        flex-direction: row;
        background-color: #bbb;
      }
      .wiki-title {
        width: 100%;
        border-style: solid;
        border-width: 2px;
        float: left;
        background-color: #fff;
      }
    `;
  }
}
