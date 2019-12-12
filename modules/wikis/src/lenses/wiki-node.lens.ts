import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { LensElement } from '@uprtcl/lenses';
import { EveesTypes } from '@uprtcl/evees';
import { DocumentsTypes } from '@uprtcl/documents';
import { Creatable } from '@uprtcl/cortex';
import { GraphQlTypes } from '@uprtcl/common';

import { WikiNode } from '../types';

export class WikiNodeLens extends moduleConnect(LitElement) implements LensElement<WikiNode> {
  @property({ type: Object })
  data!: WikiNode;

  @property({ type: String })
  selectedPageHash!: String;

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

    this.data.pages.push(perspective.id);
    this.updateContent(this.data.pages);
  };

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    console.log('funciona')
    const result = await client.query({
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
    console.log('esto se deberia de mostrar')
    console.log(result);
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
          <h2>${this.data.title}</h2>
        </div>
        ${
          this.selectedPageHash
           ?
          html`
            <div class="page">
              <h3>Title</h3>
            </div>
            <div class="actions">
              <cortex-actions .hash=${this.selectedPageHash} />
            </div>` : 
          html`
            <h2> Welcome sir </h2>
          `
        }
      </div>
    `;
  }

  render() {
    return html`
      ${this.wikiHeader()}
      <div class="row">
        <div class="column left" style="background-color:#aaa;">
          <ul>
            ${this.data.pages.map(page => {
              return html`
                <li @click=${() => this.setPage(page)}>${page}</li>
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
                  <home-page .wikiHash=${this.wikiId}></home-page>
                `
              }
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
        height: 4%;
        width: 100%;
        background-color:#bbb;
      }
      .wiki-title {
        width: 25%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        border-style: solid;
        border-width: 2px;
        float: left;
        background-color:#fff;
      }
      .page {
        width: 65%;
        text-align: left;
        border-style: solid;
        border-width: 2px;
        border-left-width: 0px;
        background-color:#fff;
      }
      .actions {
        width: 10%;
        text-align: center;
        border-style: solid;
        border-width: 2px;
        border-left-width: 0px;
      }
    `;
  }
}