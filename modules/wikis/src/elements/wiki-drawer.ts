import { property, html, css, LitElement } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729

export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { htmlToText, TextType, TextNode, DocumentsModule } from '@uprtcl/documents';
import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';
import { Entity, HasTitle, CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import {
  MenuConfig,
  EveesRemote,
  EveesModule,
  eveeColor,
  DEFAULT_COLOR,
  RemoteMap,
  EveesHelpers
} from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CASStore } from '@uprtcl/multiplatform';

import { Wiki } from '../types';

import '@material/mwc-drawer';
import { WikiBindings } from '../bindings';

const LOGINFO = false;
const MAX_LENGTH = 999;

interface PageData {
  id: string
  title: string,
}

export class WikiDrawer extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-DRAWER');

  @property({ type: String, attribute: 'ref' })
  firstRef!: string;

  @property({ type: String, attribute: 'default-authority' })
  defaultAuthority!: string;

  @property({ attribute: false })
  ref!: string;

  @property({ attribute: false })
  wiki: Entity<Wiki> | undefined;

  @property({ type: Number })
  selectedPageIx: number | undefined = undefined;

  @property({ attribute: false })
  pagesList: PageData[] | undefined = undefined;

  authority: string = '';
  context: string = '';
  currentHeadId: string | undefined = undefined;
  editable: boolean = false;

  protected client!: ApolloClient<any>;
  protected eveesRemotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;
  protected remoteMap!: RemoteMap;
  
  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.remoteMap = this.request(EveesModule.bindings.RemoteMap);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    
    this.logger.log('firstUpdated()', { ref: this.ref });

    this.ref = this.firstRef;
    this.loadWiki();
  }

  updated(changedProperties) {
    if (changedProperties.has('ref')) {
      if (changedProperties.get('ref') !== undefined) {
        this.loadWiki();
      }
    }

    if (changedProperties.has('firstRef')) {
      this.ref = this.firstRef;
      this.loadWiki();
    }
  }

  color() {
    if (this.firstRef === this.ref) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(this.ref as string);
    }
  }

  async loadWiki() {
    const result = await this.client.query({
      query: gql`
      {
        entity(ref: "${this.ref}") {
          id
          ... on Perspective {
            payload {
              authority
            }
            head {
              id 
              ... on Commit {
                data {
                  id
                  ... on Wiki {
                    title
                    pages {
                      id
                    }
                  }
                }
              }
            }
            context {
              id
            }
          }
          _context {
            patterns {
              accessControl {
                canWrite
              }
            }
          }
        }
      }`
    });

    this.authority = result.data.entity.payload.authority;
    this.currentHeadId = result.data.entity.head.id;
    this.editable = result.data.entity._context.patterns.accessControl.canWrite;
    this.context = result.data.entity.context.id;

    this.wiki = {
      id: result.data.entity.head.data.id,
      object: {
        title: result.data.entity.head.data.title,
        pages: result.data.entity.head.data.pages.map(p => p.id)
      }
    };

    this.logger.log('loadWiki()', { this: this, result });

    this.loadPagesData();

    this.requestUpdate();
  }

  async loadPagesData() {
    if (!this.wiki) return;

    this.logger.log('loadPagesData()');

    const pagesListPromises = this.wiki.object.pages.map(
      async (pageId):Promise<PageData> => {
      
      const data = await EveesHelpers.getPerspectiveData(this.client, pageId);
      const hasTitle: HasTitle = this.recognizer
        .recognizeBehaviours(data)
        .find(b => (b as HasTitle).title);

      const title = hasTitle.title(data);

      return {
        id: pageId,
        title
      };
    });

    this.pagesList = await Promise.all(pagesListPromises);
    this.logger.log('loadPagesData()', { pagesList: this.pagesList });
  }

  selectPage(ix: number | undefined) {
    if (!this.wiki) return;

    this.selectedPageIx = ix;

    if (this.selectedPageIx === undefined) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent('page-selected', {
        detail: {
          pageId: this.wiki.object.pages[this.selectedPageIx]
        }
      })
    );
  }

  getStore(authority: string, type: string): CASStore | undefined {
    const remote = this.eveesRemotes.find(r => r.authority === authority);
    if (!remote) throw new Error(`Remote not found for authority ${authority}`);
    return this.remoteMap(remote);
  }

  async createPage(page: TextNode, authority: string) {
    if (!this.eveesRemotes) throw new Error('eveesRemotes undefined');
    if (!this.client) throw new Error('client undefined');

    const remote = this.eveesRemotes.find(r => r.authority === authority);
    if (!remote) throw new Error(`Remote not found for authority ${authority}`);

    const store = this.getStore(authority, DocumentsModule.bindings.TextNodeType);
    if (!store) throw new Error('store is undefined');

    const dataId = await EveesHelpers.createEntity(this.client, store, page);
    const headId = await EveesHelpers.createCommit(this.client, remote, { dataId, parentsIds: [this.currentHeadId ? this.currentHeadId : ''] });
    return EveesHelpers.createPerspective(this.client, remote, { headId, context: `${this.context}_${Date.now()}` });
  }

  async updateContent(newWiki: Wiki) {
    const store = this.getStore(this.authority, WikiBindings.WikiType);
    if (!store) throw new Error('store is undefined');

    const remote = this.eveesRemotes.find(r => r.authority === this.authority);
    if (!remote) throw Error(`Remote not found for authority ${this.authority}`);

    const dataId = await EveesHelpers.createEntity(this.client, store, newWiki);
    const headId = await EveesHelpers.createCommit(this.client, remote, { dataId, parentsIds: [this.currentHeadId ? this.currentHeadId : ''] });
    await EveesHelpers.updateHead(this.client, this.ref, headId)

    this.logger.info('updateContent()', newWiki);

    this.loadWiki();
  }

  async splicePages(pages: any[], index: number, count: number) {
    if (!this.wiki) throw new Error('wiki undefined');

    const getPages = pages.map(page => {
      if (typeof page !== 'string') {
        return this.createPage(page, this.authority);
      } else {
        return Promise.resolve(page);
      }
    });

    const pagesIds = await Promise.all(getPages);

    const newObject = { ...this.wiki.object };
    const removed = newObject.pages.splice(index, count, ...pagesIds);

    return {
      entity: newObject,
      removed
    };
  }

  async newPage(index?: number) {
    if (!this.wiki) return;

    const newPage: TextNode = {
      text: '',
      type: TextType.Title,
      links: []
    };

    index = index === undefined ? this.wiki.object.pages.length : index;

    const result = await this.splicePages([newPage], index, 0);
    if (!result.entity) throw Error('problem with splice pages');

    await this.updateContent(result.entity);

    this.selectedPageIx = index;
  }

  async movePage(fromIndex: number, toIndex: number) {
    const { removed } = await this.splicePages([], fromIndex, 1);
    const { entity } = await this.splicePages(removed as string[], toIndex, 0);

    await this.updateContent(entity);

    if (this.selectedPageIx === undefined) return;

    /** this page was moved */
    if (fromIndex === this.selectedPageIx) {
      this.selectPage(toIndex);
    } else {
      /** a non selected page was moved to the selected index */
      if (toIndex === this.selectedPageIx) {
        this.selectPage(fromIndex);
      }
    }
  }

  async removePage(pageIndex: number) {
    const { entity } = await this.splicePages([], pageIndex, 1);
    await this.updateContent(entity);

    if (this.selectedPageIx === undefined) return;

    /** this page was removed */
    if (pageIndex === this.selectedPageIx) {
      this.selectPage(undefined);
    }

    /** a younger page was removed */
    if (pageIndex < this.selectedPageIx) {
      this.selectedPageIx = this.selectedPageIx - 1;
    }
  }

  async optionOnPage(pageIndex: number, option: string) {
    switch (option) {
      case 'move-up':
        this.movePage(pageIndex, pageIndex - 1);
        break;

      case 'move-down':
        this.movePage(pageIndex, pageIndex + 1);
        break;

      case 'remove':
        this.removePage(pageIndex);
        break;
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      this.ref = event.detail.perspectiveId;
      this.pagesList = undefined;
      this.editable = false;
      this.loadWiki();
    }) as EventListener);
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
        ${this.pagesList.map((page, ix) => {
          // this.logger.log(`rendering page title ${page.id}`, menuConfig);
          return this.renderPageItem(page, ix);
        })}
      </mwc-list>
    `;
  }

  renderPageItem(page: PageData, ix: number) {
    const menuConfig: MenuConfig = {
      'move-up': {
        disabled: ix === 0,
        text: 'move up',
        graphic: 'arrow_upward'
      },
      'move-down': {
        disabled: ix === (this.pagesList as any[]).length - 1,
        text: 'move down',
        graphic: 'arrow_downward'
      },
      remove: {
        disabled: false,
        text: 'remove',
        graphic: 'clear'
      }
    };

    const text = htmlToText(page.title);
    const empty = text === '';
    const selected = this.selectedPageIx === ix;

    let classes: string[] = [];

    classes.push('page-item')
    if (empty) classes.push('title-empty');
    if (selected) classes.push('title-selected');

    return html`
      <div class=${classes.join(' ')} @click=${() => this.selectPage(ix)}>
        <div class="text-container">${text.length < MAX_LENGTH ? text : `${text.slice(0, MAX_LENGTH)}...`}</div>
        ${this.editable ? html`
          <evees-options-menu 
            @option-click=${e => this.optionOnPage(ix, e.detail.key)} 
            .config=${menuConfig}>
          </evees-options-menu>` : ''}
      </div>`;
  }

  render() {
    this.logger.log('render()', { wiki: this.wiki, ref: this.ref, editable: this.editable });
    if (!this.wiki || !this.ref)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    return html`
      <div class="app-drawer">
        <div class="app-navbar">
          <div
            class="color-bar"
            style=${styleMap({
              backgroundColor: this.color()
            })}
          ></div>

          <div>
            ${this.renderPageList()}
          </div>

          ${this.editable
            ? html`
                <div class="button-row">
                  <mwc-button outlined icon="note_add" @click=${() => this.newPage()}>
                    ${this.t('wikis:new-page')}
                  </mwc-button>
                </div>
              `
            : html``}
        </div>

        <div class="app-content">
          ${this.selectedPageIx !== undefined
            ? html`
                <wiki-page
                  @nav-back=${() => this.selectPage(undefined)}
                  @page-title-changed=${() => this.loadPagesData()}
                  pageHash=${this.wiki.object.pages[this.selectedPageIx]}
                  color=${this.color() ? this.color() : ''}
                >
                </wiki-page>
              `
            : html`
                <wiki-home
                  wikiHash=${this.ref}
                  title=${this.wiki.object.title}
                  color=${this.color()}
                >
                  <evees-info-page
                    slot="evee-page"
                    first-perspective-id=${this.firstRef as string}
                    perspective-id=${this.ref}
                    evee-color=${this.color()}
                    default-authority=${this.defaultAuthority as string}
                  ></evees-info-page>
                </wiki-home>
              `}
        </div>
      </div>
    `;
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
          flex: 1 1 0;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji',
            Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
          color: #37352f;
          --mdc-theme-primary: #2196f3;
        }
        .app-drawer {
          flex: 1 1 0;
          display: flex;
          flex-direction: horizontal;
        }
        .app-navbar {
          width: 260px;
          flex-shrink: 0;
        }
        .app-content {
          border-left: solid #cccccc 1px;
          min-width: 475px;
          max-width: calc(100% - 260px - 1px);
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .evee-info {
          height: 40px;
        }
        .column {
          height: 100%;
        }
        .color-bar {
          height: 1vw;
          max-height: 5px;
          width: 100%;
        }
        .page-item {
          min-height: 48px;
          cursor: pointer;
          width: calc(100% - 19px);
          display: flex;
          padding: 0px 3px 0px 16px;
          transition: all 0.1s ease-in;
        }
        .page-item .text-container {
          max-width: calc(100% - 48px);
          overflow-x: hidden;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .page-item:hover{
          background-color: #e8ecec;
        }
        .title-empty {
          color: #a2a8aa;
          font-style: italic;
        }
        .title-selected {
          font-weight: bold;
          background-color: rgb(200,200,200,0.2);
        }
        .empty {
          width: 100%;
          text-align: center;
          padding-top: 24px;
          color: #a2a8aa;
        }
        .button-row {
          text-align: center;
          width: calc(100% - 20px);
          padding: 16px 10px 8px 10px;
          display: flex;
        }
        .button-row mwc-button {
          flex-grow: 1;
        }
      `
    ];
  }
}
