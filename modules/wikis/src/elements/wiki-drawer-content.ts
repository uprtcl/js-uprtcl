import { property, html, css, LitElement, query } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { htmlToText, TextType, TextNode } from '@uprtcl/documents';
import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { styles } from '@uprtcl/common-ui';
import { Entity, HasTitle, CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import {
  EveesRemote,
  EveesModule,
  EveesHelpers,
  Perspective,
  CONTENT_UPDATED_TAG,
  ContentUpdatedEvent,
  EveesConfig
} from '@uprtcl/evees';
import { MenuConfig } from '@uprtcl/common-ui';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CASStore, loadEntity } from '@uprtcl/multiplatform';

import { Wiki } from '../types';

import { WikiBindings } from '../bindings';

const MAX_LENGTH = 999;

interface PageData {
  id: string;
  title: string;
}

export class WikiDrawerContent extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-DRAWER-CONTENT');

  @property({ type: String })
  uref!: string;

  @property({ type: String })
  color!: string;

  @property({ type: String, attribute: 'official-owner' })
  officialOwner!: string;

  @property({ type: Boolean, attribute: 'check-owner' })
  checkOwner: boolean = false;

  @property({ type: Boolean })
  editable: boolean = false;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  wiki: Entity<Wiki> | undefined;

  @property({ attribute: false })
  pagesList: PageData[] | undefined = undefined;

  @property({ attribute: false })
  selectedPageIx: number | undefined = undefined;

  @property({ attribute: false })
  creatingNewPage: boolean = false;

  @property({ attribute: false })
  editableActual: boolean = false;

  remote: string = '';
  currentHeadId: string | undefined = undefined;

  protected client!: ApolloClient<any>;
  protected remotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;
  protected editableRemotesIds!: string[];

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.remotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    const config = this.request(EveesModule.bindings.Config) as EveesConfig;
    this.editableRemotesIds = config.editableRemotesIds ? config.editableRemotesIds : [];

    this.logger.log('firstUpdated()', { uref: this.uref });

    this.loading = true;
    await this.load();
    this.loading = false;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(CONTENT_UPDATED_TAG, ((e: ContentUpdatedEvent) => {
      if (e.detail.uref === this.uref) {
        this.logger.log('ContentUpdatedEvent()', this.uref);
        this.load();
      }
      if (this.pagesList && this.pagesList.findIndex(page => page.id === e.detail.uref) !== -1) {
        this.loadPagesData();
      }
    }) as EventListener);
  }

  updated(changedProperties) {
    if (changedProperties.get('uref') !== undefined) {
      this.logger.info('updated()', { changedProperties });
      this.reset();
    }
  }

  async reset() {
    // await this.client.resetStore();
    this.pagesList = undefined;
    this.selectedPageIx = undefined;
    this.wiki = undefined;
    this.logger.log('reset()', this.uref);
    this.loading = true;
    this.load();
    this.loading = false;
  }

  async load() {
    if (this.uref === undefined) return;

    this.logger.log('load()');

    const perspective = (await loadEntity(this.client, this.uref)) as Entity<Signed<Perspective>>;
    const headId = await EveesHelpers.getPerspectiveHeadId(this.client, this.uref);

    this.remote = perspective.object.payload.remote;
    const canWrite = await EveesHelpers.canWrite(this.client, this.uref);

    this.currentHeadId = headId;
    this.editableActual =
      this.editableRemotesIds.length > 0
        ? this.editableRemotesIds.includes(this.remote) && canWrite
        : canWrite;

    this.wiki = await EveesHelpers.getPerspectiveData(this.client, this.uref);

    await this.loadPagesData();
  }

  async loadPagesData() {
    if (!this.wiki) {
      this.pagesList = [];
      return;
    }

    this.logger.log('loadPagesData()');

    const pagesListPromises = this.wiki.object.pages.map(
      async (pageId): Promise<PageData> => {
        const data = await EveesHelpers.getPerspectiveData(this.client, pageId);
        if (!data) throw new Error(`data not found for page ${pageId}`);
        const hasTitle: HasTitle = this.recognizer
          .recognizeBehaviours(data)
          .find(b => (b as HasTitle).title);

        const title = hasTitle.title(data);

        return {
          id: pageId,
          title
        };
      }
    );

    this.pagesList = await Promise.all(pagesListPromises);
    this.logger.log('loadPagesData()', { pagesList: this.pagesList });
  }

  selectPage(ix: number | undefined) {
    if (!this.wiki) return;
    this.selectedPageIx = ix;
  }

  getStore(remote: string, type: string): CASStore | undefined {
    const remoteInstance = this.remotes.find(r => r.id === remote);
    if (!remoteInstance) throw new Error(`Remote not found for remote ${remote}`);
    return remoteInstance.store;
  }

  handlePageDrag(e, pageId) {
    const dragged = { uref: pageId, parentId: this.uref };
    this.logger.info('dragging', dragged);
    e.dataTransfer.setData('text/plain', JSON.stringify(dragged));
  }

  async handlePageDrop(e) {
    const wikiObject = this.wiki
      ? this.wiki.object
      : {
          title: '',
          pages: []
        };

    const dragged = JSON.parse(e.dataTransfer.getData('text/plain'));

    this.logger.info('dropped', dragged);

    if (!this.wiki) return;
    if (!dragged.uref) return;
    if (dragged.parentId === this.uref) return;

    const index = this.wiki.object.pages.length;

    const result = await this.splicePages(wikiObject, [dragged.uref], index, 0);

    if (!result.entity) throw Error('problem with splice pages');

    await this.updateContent(result.entity);
  }

  dragOverEffect(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async createPage(page: TextNode, remote: string) {
    if (!this.remotes) throw new Error('eveesRemotes undefined');
    if (!this.client) throw new Error('client undefined');

    const remoteInstance = this.remotes.find(r => r.id === remote);
    if (!remoteInstance) throw new Error(`Remote not found for remote ${remote}`);

    const dataId = await EveesHelpers.createEntity(this.client, remoteInstance.store, page);
    const headId = await EveesHelpers.createCommit(this.client, remoteInstance.store, {
      dataId,
      parentsIds: []
    });
    return EveesHelpers.createPerspective(this.client, remoteInstance, {
      headId,
      parentId: this.uref
    });
  }

  async updateContent(newWiki: Wiki) {
    const store = this.getStore(this.remote, WikiBindings.WikiType);
    if (!store) throw new Error('store is undefined');

    const remote = this.remotes.find(r => r.id === this.remote);
    if (!remote) throw Error(`Remote not found for remote ${this.remote}`);

    const dataId = await EveesHelpers.createEntity(this.client, store, newWiki);
    const headId = await EveesHelpers.createCommit(this.client, remote.store, {
      dataId,
      parentsIds: this.currentHeadId ? [this.currentHeadId] : undefined
    });
    await EveesHelpers.updateHead(this.client, this.uref, headId);

    this.logger.info('updateContent()', newWiki);

    await this.load();
  }

  async replacePagePerspective(oldId, newId) {
    if (!this.wiki) throw new Error('wiki undefined');

    const ix = this.wiki.object.pages.findIndex(pageId => pageId === oldId);

    if (ix === -1) return;

    const result = await this.splicePages(this.wiki.object, [newId], ix, 1);
    if (!result.entity) throw Error('problem with splice pages');

    await this.updateContent(result.entity);
  }

  async splicePages(wikiObject: Wiki, pages: any[], index: number, count: number) {
    const getPages = pages.map(page => {
      if (typeof page !== 'string') {
        return this.createPage(page, this.remote);
      } else {
        return Promise.resolve(page);
      }
    });

    const pagesIds = await Promise.all(getPages);

    const newObject = { ...wikiObject };
    const removed = newObject.pages.splice(index, count, ...pagesIds);

    return {
      entity: newObject,
      removed
    };
  }

  async newPage(index?: number) {
    const wikiObject = this.wiki
      ? this.wiki.object
      : {
          title: '',
          pages: []
        };

    this.creatingNewPage = true;

    const newPage: TextNode = {
      text: '',
      type: TextType.Title,
      links: []
    };

    index = index === undefined ? wikiObject.pages.length : index;

    const result = await this.splicePages(wikiObject, [newPage], index, 0);
    if (!result.entity) throw Error('problem with splice pages');

    await this.updateContent(result.entity);
    this.selectPage(index);

    this.creatingNewPage = false;
  }

  async movePage(fromIndex: number, toIndex: number) {
    if (!this.wiki) throw new Error('wiki not defined');

    const { removed } = await this.splicePages(this.wiki.object, [], fromIndex, 1);
    const { entity } = await this.splicePages(this.wiki.object, removed as string[], toIndex, 0);

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
    if (!this.wiki) throw new Error('wiki not defined');

    const { entity } = await this.splicePages(this.wiki.object, [], pageIndex, 1);
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

      case 'add-below':
        this.newPage(pageIndex + 1);
        break;

      case 'remove':
        this.removePage(pageIndex);
        break;
    }
  }

  goToHome() {
    this.selectPage(undefined);
  }

  goBack() {
    this.dispatchEvent(new CustomEvent('back', { bubbles: true, composed: true }));
  }

  renderPageList(showOptions: boolean = true) {
    if (this.pagesList === undefined)
      return html`
        <uprtcl-loading class="empty-pages-loader"></uprtcl-loading>
      `;

    return html`
      ${this.pagesList.length === 0
        ? html`
            <div class="empty">
              <span><i>${this.t('wikis:no-pages-yet')}</i></span>
            </div>
          `
        : html`
            <uprtcl-list>
              ${this.pagesList.map((page, ix) => {
                // this.logger.log(`rendering page title ${page.id}`, menuConfig);
                return this.renderPageItem(page, ix, showOptions);
              })}
            </uprtcl-list>
          `}
      ${this.editableActual
        ? html`
            <div class="button-row">
              <uprtcl-button-loading
                icon="add_circle_outline"
                @click=${() => this.newPage()}
                ?loading=${this.creatingNewPage}
              >
                ${this.t('wikis:new-page')}
              </uprtcl-button-loading>
            </div>
          `
        : html``}
    `;
  }

  renderPageItem(page: PageData, ix: number, showOptions: boolean) {
    const menuConfig: MenuConfig = {
      'move-up': {
        disabled: ix === 0,
        text: 'move up',
        icon: 'arrow_upward'
      },
      'move-down': {
        disabled: ix === (this.pagesList as any[]).length - 1,
        text: 'move down',
        icon: 'arrow_downward'
      },
      'add-below': {
        disabled: false,
        text: 'create below',
        icon: 'add'
      },
      remove: {
        disabled: false,
        text: 'remove',
        icon: 'clear'
      }
    };

    const text = htmlToText(page.title);
    const empty = text === '';
    const selected = this.selectedPageIx === ix;

    let classes: string[] = [];

    classes.push('page-item');
    if (empty) classes.push('title-empty');
    if (selected) classes.push('title-selected');

    return html`
      <div
        class=${classes.join(' ')}
        draggable="false"
        @dragstart=${e => this.handlePageDrag(e, page.id)}
        @click=${() => this.selectPage(ix)}
      >
        <div class="text-container">
          ${text.length < MAX_LENGTH ? text : `${text.slice(0, MAX_LENGTH)}...`}
        </div>
        ${this.editableActual && showOptions
          ? html`
              <div class="item-menu-container">
                <uprtcl-options-menu
                  class="options-menu"
                  @option-click=${e => this.optionOnPage(ix, e.detail.key)}
                  .config=${menuConfig}
                >
                </uprtcl-options-menu>
              </div>
            `
          : ''}
      </div>
    `;
  }

  renderHome() {
    return ``;
    // return this.pagesList
    //   ? this.pagesList.map((page, ix) => {
    //       return html`
    //         <uprtcl-card class="home-card bg-transition" @click=${() => this.selectPage(ix)}>
    //           ${page.title}
    //         </uprtcl-card>
    //       `;
    //     })
    //   : '';
  }

  render() {
    if (this.loading)
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;

    this.logger.log('rendering wiki after loading');

    return html`
      <div class="app-content-with-nav">
        <div class="app-navbar" @dragover=${this.dragOverEffect} @drop=${this.handlePageDrop}>
          ${this.renderPageList()}
        </div>

        <div class="app-content">
          ${this.selectedPageIx !== undefined && this.wiki
            ? html`
                <div class="page-container">
                  <documents-editor
                    id="doc-editor"
                    .client=${this.client}
                    uref=${this.wiki.object.pages[this.selectedPageIx] as string}
                    parent-id=${this.uref}
                    color=${this.color}
                    official-owner=${this.officialOwner}
                    ?check-owner=${this.checkOwner}
                    show-info
                  >
                  </documents-editor>
                </div>
              `
            : html`
                <div class="home-container">
                  ${this.renderHome()}
                </div>
              `}
        </div>
      </div>
    `;
  }

  static get styles() {
    return [
      styles,
      css`
        :host {
          display: flex;
          flex: 1 1 0;
          flex-direction: column;
        }
        .app-content-with-nav {
          flex: 1 1 0;
          display: flex;
          flex-direction: row;
          position: relative;
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
          position: relative;
        }
        .empty-pages-loader {
          margin-top: 22px;
          display: block;
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
          white-space: nowrap;
          overflow: hidden;
          max-width: calc(100% - 48px);
          overflow-x: hidden;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
        }
        .page-item .item-menu-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .page-item .item-menu-container .options-menu {
          --box-width: 160px;
          font-weight: normal;
        }
        .page-item:hover {
          background-color: #e8ecec;
        }
        .title-empty {
          color: #a2a8aa;
          font-style: italic;
        }
        .title-selected {
          font-weight: bold;
          background-color: rgb(200, 200, 200, 0.2);
        }
        .empty {
          width: 100%;
          text-align: center;
          padding-top: 24px;
          color: #a2a8aa;
        }
        .button-row {
          width: calc(100% - 20px);
          padding: 16px 10px 8px 10px;
          display: flex;
        }
        .button-row uprtcl-button-loading {
          margin: 0 auto;
          width: 180px;
        }
        .page-container {
          margin: 0 auto;
          max-width: 900px;
          width: 100%;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .home-container {
          text-align: center;
          height: auto;
          padding: 6vw 0vw;
        }
        .home-card {
          width: 100%;
          font-size: 20px;
          display: block;
          max-width: 340px;
          margin: 18px auto;
          cursor: pointer;
          padding: 8px 24px;
          font-weight: bold;
        }
        .home-card:hover {
          background-color: #f1f1f1;
        }
      `
    ];
  }
}
