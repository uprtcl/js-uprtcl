import { property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import '@material/mwc-drawer';
import '@material/mwc-top-app-bar';
import '@material/mwc-ripple';

import {
  EveeContent
} from '@uprtcl/evees';
import { htmlToText, TextType, DocumentsModule } from '@uprtcl/documents';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Logger } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';

import { Wiki } from '../types';
import { Hashed } from '@uprtcl/cortex';
import { WikiBindings } from 'src/bindings';

export class WikiDrawer extends EveeContent<Wiki>{
  
  logger = new Logger('WIKI-DRAWER');

  @property({ type: String })
  selectedPageHash: string | undefined = undefined;

  @property({ type: Object, attribute: false })
  pagesList: Array<{ title: string; id: string }> | undefined = undefined;

  symbol: symbol | undefined = WikiBindings.WikiEntity;
  
  getEmptyEntity(): Wiki {
    throw new Error("Method not implemented.");
  }

  updated(changedProperties: any) {
    if (changedProperties.get('data') !== undefined) {
      this.loadPagesData();
    }
  }

  async loadPagesData() {
    const wiki = this.data as Hashed<Wiki>;

    const pagesListPromises = wiki.object.pages.map(async pageId => {
      const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

      const result = await client.query({
        query: gql`
        {
          entity(id: "${pageId}") {
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
        }`
      });

      return {
        id: pageId,
        title: result.data.entity._context.patterns.content._context.patterns.title
      };
    });

    this.pagesList = await Promise.all(pagesListPromises);
  }

  async firstUpdated() {
    this.logger.log('firstUpdated()');
    this.updateRefData();
    this.loadPagesData();
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

  newPage() {
    const pageContent = {
      text: '<h1>New page</h1>',
      type: TextType.Title,
      links: []
    };

    this.createChild(pageContent, DocumentsModule.bindings.TextNodeEntity);
  }

  renderPageList() {
    if (!this.pagesList)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    if (this.pagesList.length === 0)
      return html`
        <div class="empty">
          <span><i>${this.t('wikis:no-pages-yet')}</i></span>
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
    this.logger.log('render()', { data: this.data, ref: this.ref, editable: this.editable, level: this.level });
    if (!this.data || !this.ref)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    return html`
      <mwc-drawer>
        <div class="column">
          <div
            class="color-bar"
            style=${styleMap({
              backgroundColor: this.color
            })}
          ></div>

          ${this.editable
            ? html`
                <div class="button-row">
                  <mwc-button outlined icon="note_add" @click=${this.newPage}>
                    ${this.t('wikis:new-page')}
                  </mwc-button>
                </div>
              `
            : html``}
          <div>
            ${this.renderPageList()}
          </div>
        </div>

        <div slot="appContent" class="fill-content">
          ${this.selectedPageHash
            ? html`
                <wiki-page
                  @nav-back=${() => this.selectPage(undefined)}
                  pageHash=${this.selectedPageHash}
                  color=${this.color ? this.color : ''}
                >
                </wiki-page>
              `
            : html`
                <wiki-home
                  wikiHash=${this.ref}
                  title=${this.data.object.title}
                  color=${this.color ? this.color : ''}
                >
                  <slot slot="evee-page" name="evee-page"></slot>
                </wiki-home>
              `}
        </div>
      </mwc-drawer>
    `;
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji',
            Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
          color: #37352f;
        }
        .evee-info {
          height: 40px;
        }
        .column {
          height: 100%;
          background-color: #f7f6f3;
        }
        .color-bar {
          height: 1vw;
          max-height: 5px;
          width: 100%;
        }
        .empty {
          width: 100%;
          text-align: center;
          padding-top: 24px;
          color: #a2a8aa;
        }
        .button-row {
          margin: 16px 0px 8px 0px;
          text-align: center;
          width: 100%;
        }
      `
    ];
  }
}
