import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { LensElement } from '@uprtcl/lenses';
import { EveesTypes } from '@uprtcl/evees';
import { DocumentsTypes } from '@uprtcl/documents';
import { Creatable } from '@uprtcl/cortex';
import { GraphQlTypes } from '@uprtcl/common';

import { WikiNode } from '../types';
import { ApolloClient, gql } from 'apollo-boost';

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
      return regexp.test(provider.service.uprtclProviderLocator);
    });

    const pagesProvider: any = this.requestAll(DocumentsTypes.DocumentsRemote).find(
      (provider: any) => {
        const regexp = new RegExp('^http');
        return regexp.test(provider.service.uprtclProviderLocator);
      }
    );

    const pageHash = await pagePattern.create({}, pagesProvider.service.uprtclProviderLocator);

    const perspective = await perspectivePattern.create(
      { dataId: pageHash.id },
      eveesProvider.service.uprtclProviderLocator
    );

    this.data.pages.push(perspective.id);
    this.updateContent(this.data.pages);
  };

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    const result = await client.query({
      query: gql`
      {
        getEntity(id: "${this.wikiId}") {
          id
          entity {
            ... on Wiki { 
              Title
            }
          }
        }
      }`
    });

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
        <div class="page">
          <h2>I'm the title of the page</h2>
        </div>
        <div class="proposal-action">
          <h3>Update Proposals</h3>
        </div>
        <div class="proposal-action" @click=${() => (this.selectedPageHash = '')}>
          <h3>Others Perspectives</h3>
        </div>
        <div class="plugin">
          <slot name="plugins"> </slot>
        </div>
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
                  <cortex-entity .hash=${this.selectedPageHash}></cortex-entity>
                `
              : html`
                  <perspectives-list .rootPerspectiveId=${this.wikiId} />
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
        background-color: #fff;
        height: 4%;
      }

      .wiki-title {
        width: 25%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        border-style: solid;
        border-width: 2px;
        float: left;
      }

      .page {
        width: 40%;
        text-align: left;
        border-style: solid;
        border-width: 2px;
        border-left-width: 0px;
      }

      .proposal-action {
        width: 15%;
        text-align: center;
        border-style: solid;
        border-width: 2px;
        border-left-width: 0px;
      }

      .plugin {
        width: 5%;
        justify-content: center;
        border-style: solid;
        border-width: 2px;
        border-left-width: 0px;
      }
    `;
  }
}
