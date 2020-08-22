import { property, html, css, LitElement, query } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(
      /([A-Z])/g,
      (matches) => `-${matches[0].toLowerCase()}`
    );
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import {
  htmlToText,
  TextType,
  TextNode,
  DocumentsModule,
} from '@uprtcl/documents';
import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';
import {
  Entity,
  HasTitle,
  CortexModule,
  PatternRecognizer,
  Signed,
} from '@uprtcl/cortex';
import {
  EveesRemote,
  EveesModule,
  eveeColor,
  DEFAULT_COLOR,
  RemoteMap,
  EveesHelpers,
  Perspective,
} from '@uprtcl/evees';
import { MenuConfig } from '@uprtcl/common-ui';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CASStore, loadEntity } from '@uprtcl/multiplatform';

import { Wiki } from '../types';

import { WikiBindings } from '../bindings';

const LOGINFO = false;
const MAX_LENGTH = 999;

interface PageData {
  id: string;
  title: string;
}

export class WikiDrawer extends moduleConnect(LitElement) {
  logger = new Logger('WIKI-DRAWER');

  @property({ type: String, attribute: 'uref' })
  firstRef!: string;

  @property({ type: String, attribute: 'default-remote' })
  defaultRemoteId!: string;

  @property({ type: Array })
  editableRemotes: string[] = [];

  @property({ attribute: false })
  uref!: string;

  @property({ attribute: false })
  loading: boolean = false;

  @property({ attribute: false })
  wiki: Entity<Wiki> | undefined;

  @property({ type: Number })
  selectedPageIx: number | undefined = undefined;

  @property({ attribute: false })
  pagesList: PageData[] | undefined = undefined;

  @property({ attribute: false })
  creatingNewPage: boolean = false;

  @property({ attribute: false })
  isDrawerOpened = true;

  @property({ attribute: false })
  isMobile = false;

  @property({ attribute: false })
  hasSelectedPage = false;

  @property({ attribute: false })
  firstRefAuthor: string = '';

  @property({ attribute: false })
  author: string = '';

  @property({ type: Boolean, attribute: 'show-exit' })
  showExit: boolean = false;

  @property({ attribute: false })
  showEditTitle: boolean = false;

  @property({ attribute: false })
  updatingTitle: boolean = false;

  remote: string = '';
  path: string = '';
  context: string | undefined = undefined;
  currentHeadId: string | undefined = undefined;
  editable: boolean = false;

  protected client!: ApolloClient<any>;
  protected eveesRemotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;
  protected remoteMap!: RemoteMap;

  constructor() {
    super();
    this.isViewportMobile();
    window.addEventListener('resize', this.isViewportMobile.bind(this));
  }

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.remoteMap = this.request(EveesModule.bindings.RemoteMap);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    this.logger.log('firstUpdated()', { uref: this.uref });

    this.uref = this.firstRef;
    this.loadWiki();

    const firstPerspective = await loadEntity<Signed<Perspective>>(
      this.client,
      this.firstRef
    );
    if (firstPerspective) {
      this.firstRefAuthor = firstPerspective.object.payload.creatorId;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('uref')) {
      if (changedProperties.get('uref') !== undefined) {
        this.loadWiki();
      }
    }

    if (changedProperties.has('firstRef')) {
      this.uref = this.firstRef;
      this.loadWiki();
    }
  }

  color() {
    if (this.firstRef === this.uref) {
      return DEFAULT_COLOR;
    } else {
      return eveeColor(this.uref as string);
    }
  }

  private isViewportMobile() {
    if (window.innerWidth <= 768) {
      if (!this.isMobile) {
        this.isMobile = true;
      }
    } else {
      if (this.isMobile) {
        this.isMobile = false;
      }
    }
  }

  async resetWikiPerspective() {
    // await this.client.resetStore();
    this.pagesList = undefined;
    this.editable = false;
    this.loadWiki();
  }

  async loadWiki() {
    if (this.uref === undefined) return;

    this.loading = true;

    const perspective = (await loadEntity(this.client, this.uref)) as Entity<
      Signed<Perspective>
    >;
    const headId = await EveesHelpers.getPerspectiveHeadId(
      this.client,
      this.uref
    );
    const context = await EveesHelpers.getPerspectiveContext(
      this.client,
      this.uref
    );

    this.remote = perspective.object.payload.remote;

    const remote = this.eveesRemotes.find((r) => r.id === this.remote);
    if (!remote) throw new Error(`remote not found ${this.remote}`);
    const canWrite = await remote.canWrite(this.uref);

    this.path = perspective.object.payload.path;
    this.author = perspective.object.payload.creatorId;
    this.currentHeadId = headId;
    this.editable =
      this.editableRemotes.length > 0
        ? this.editableRemotes.includes(this.remote)
          ? canWrite
          : false
        : canWrite;
    this.context = context;

    this.wiki = await EveesHelpers.getPerspectiveData(this.client, this.uref);

    this.requestUpdate();
    await this.loadPagesData();

    this.loading = false;
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
        const hasTitle: HasTitle = this.recognizer
          .recognizeBehaviours(data)
          .find((b) => (b as HasTitle).title);

        const title = hasTitle.title(data);

        return {
          id: pageId,
          title,
        };
      }
    );

    this.pagesList = await Promise.all(pagesListPromises);
    this.logger.log('loadPagesData()', { pagesList: this.pagesList });
  }

  selectPage(ix: number | undefined) {
    if (!this.wiki) return;

    this.selectedPageIx = ix;

    if (this.selectedPageIx === undefined) {
      this.hasSelectedPage = false;
      return;
    }

    this.dispatchEvent(
      new CustomEvent('page-selected', {
        detail: {
          pageId: this.wiki.object.pages[this.selectedPageIx],
        },
      })
    );
    this.hasSelectedPage = true;
    if (this.isMobile) {
      this.isDrawerOpened = false;
    }
  }

  getStore(remote: string, type: string): CASStore | undefined {
    const remoteInstance = this.eveesRemotes.find((r) => r.id === remote);
    if (!remoteInstance)
      throw new Error(`Remote not found for remote ${remote}`);
    return this.remoteMap(remoteInstance);
  }

  async createPage(page: TextNode, remote: string) {
    if (!this.eveesRemotes) throw new Error('eveesRemotes undefined');
    if (!this.client) throw new Error('client undefined');

    const remoteInstance = this.eveesRemotes.find((r) => r.id === remote);
    if (!remoteInstance)
      throw new Error(`Remote not found for remote ${remote}`);

    const store = this.getStore(remote, DocumentsModule.bindings.TextNodeType);
    if (!store) throw new Error('store is undefined');

    const dataId = await EveesHelpers.createEntity(this.client, store, page);
    const headId = await EveesHelpers.createCommit(
      this.client,
      remoteInstance.store,
      {
        dataId,
        parentsIds: [],
      }
    );
    return EveesHelpers.createPerspective(this.client, remoteInstance, {
      headId,
      context: `${this.context}_${Date.now()}`,
      parentId: this.uref,
    });
  }

  async updateContent(newWiki: Wiki) {
    const store = this.getStore(this.remote, WikiBindings.WikiType);
    if (!store) throw new Error('store is undefined');

    const remote = this.eveesRemotes.find((r) => r.id === this.remote);
    if (!remote) throw Error(`Remote not found for remote ${this.remote}`);

    const dataId = await EveesHelpers.createEntity(this.client, store, newWiki);
    const headId = await EveesHelpers.createCommit(this.client, remote.store, {
      dataId,
      parentsIds: [this.currentHeadId ? this.currentHeadId : ''],
    });
    await EveesHelpers.updateHead(this.client, this.uref, headId);

    this.logger.info('updateContent()', newWiki);

    this.loadWiki();
  }

  async splicePages(pages: any[], index: number, count: number) {
    if (!this.wiki) throw new Error('wiki undefined');

    const getPages = pages.map((page) => {
      if (typeof page !== 'string') {
        return this.createPage(page, this.remote);
      } else {
        return Promise.resolve(page);
      }
    });

    const pagesIds = await Promise.all(getPages);

    const newObject = { ...this.wiki.object };
    const removed = newObject.pages.splice(index, count, ...pagesIds);

    return {
      entity: newObject,
      removed,
    };
  }

  async newPage(index?: number) {
    if (!this.wiki) return;
    this.creatingNewPage = true;

    const newPage: TextNode = {
      text: '',
      type: TextType.Title,
      links: [],
    };

    index = index === undefined ? this.wiki.object.pages.length : index;

    const result = await this.splicePages([newPage], index, 0);
    if (!result.entity) throw Error('problem with splice pages');

    await this.updateContent(result.entity);

    this.selectPage(index);

    this.creatingNewPage = false;
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

  titleOptionClicked(e: CustomEvent) {
    switch (e.detail.key) {
      case 'edit-title':
        this.showEditTitle = true;
        break;
    }
  }

  async editTitle(newTitle: string) {
    this.updatingTitle = true;
    if (!this.wiki) throw new Error('wiki undefined');
    const wiki = this.wiki.object;

    wiki.title = newTitle;

    await this.updateContent(wiki);

    this.updatingTitle = false;
    this.showEditTitle = false;
  }

  goToOfficial() {
    this.uref = this.firstRef;
    if (this.isMobile) {
      this.isDrawerOpened = false;
    }
    this.goToHome();
  }

  goToHome() {
    this.selectPage(undefined);
    if (this.isMobile) {
      this.isDrawerOpened = false;
    }
  }

  goBack() {
    this.dispatchEvent(
      new CustomEvent('back', { bubbles: true, composed: true })
    );
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      this.uref = event.detail.perspectiveId;
      this.resetWikiPerspective();
    }) as EventListener);
  }

  renderPageList(showOptions: boolean = true) {
    if (this.pagesList === undefined)
      return html`
        <cortex-loading-placeholder
          class="empty-pages-loader"
        ></cortex-loading-placeholder>
      `;

    return html`
      ${this.pagesList.length === 0
        ? html`<div class="empty">
            <span><i>${this.t('wikis:no-pages-yet')}</i></span>
          </div>`
        : html`<uprtcl-list>
            ${this.pagesList.map((page, ix) => {
              // this.logger.log(`rendering page title ${page.id}`, menuConfig);
              return this.renderPageItem(page, ix, showOptions);
            })}
          </uprtcl-list>`}
      ${this.editable
        ? html`
            <div class="button-row">
              <uprtcl-button-loading
                icon="add_circle_outline"
                @click=${() => this.newPage()}
                loading=${this.creatingNewPage ? 'true' : 'false'}
                label=${this.t('wikis:new-page')}
              >
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
        graphic: 'arrow_upward',
      },
      'move-down': {
        disabled: ix === (this.pagesList as any[]).length - 1,
        text: 'move down',
        graphic: 'arrow_downward',
      },
      remove: {
        disabled: false,
        text: 'remove',
        graphic: 'clear',
      },
    };

    const text = htmlToText(page.title);
    const empty = text === '';
    const selected = this.selectedPageIx === ix;

    let classes: string[] = [];

    classes.push('page-item');
    if (empty) classes.push('title-empty');
    if (selected) classes.push('title-selected');

    return html`
      <div class=${classes.join(' ')} @click=${() => this.selectPage(ix)}>
        <div class="text-container">
          ${text.length < MAX_LENGTH ? text : `${text.slice(0, MAX_LENGTH)}...`}
        </div>
        ${this.editable && showOptions
          ? html`
              <uprtcl-options-menu
                @option-click=${(e) => this.optionOnPage(ix, e.detail.key)}
                .config=${menuConfig}
              >
              </uprtcl-options-menu>
            `
          : ''}
      </div>
    `;
  }

  renderColorBar() {
    return html`
      <div
        class="color-bar"
        style=${styleMap({
          backgroundColor: this.color(),
        })}
      ></div>
    `;
  }

  renderNavBar() {
    return html`
      <div class="nav-bar-top">
        ${this.showExit
          ? html`
              <uprtcl-button @click=${() => this.goBack()}>exit</uprtcl-button>
            `
          : ''}
        <uprtcl-button @click=${() => this.goToOfficial()}>
          official
        </uprtcl-button>
        <div class="perspective-author-wrapper">
          ${this.uref !== this.firstRef
            ? html`
                <evees-author
                  user-id=${this.author}
                  show-name="false"
                  color=${eveeColor(this.uref)}
                  @click=${() => this.goToHome()}
                ></evees-author>
              `
            : ''}
        </div>
      </div>
      <div>
        ${this.renderPageList()}
      </div>
    `;
  }

  renderSummary() {
    const contextConfig: MenuConfig = {};

    contextConfig['edit-title'] = {
      disabled: false,
      graphic: 'edit',
      text: 'edit',
    };

    return html`
      <div class="title-padding-div"></div>
      <div class="title-card-container">
        <div class="section">
          <div class="section-header">
            ${this.wiki ? this.wiki.object.title : ''}
          </div>

          <div class="section-content">
            <div class="row center-aligned">
              ${this.uref === this.firstRef
                ? html` <div class="official-name">(Official)</div> `
                : html`
                    <span class="by-3box">by</span>
                    <evees-author user-id=${this.author}></evees-author>
                  `}
            </div>
            <div class="row center-aligned title-form">
              ${this.showEditTitle
                ? html`
                    <uprtcl-form-string
                      value=${this.wiki ? this.wiki.object.title : ''}
                      label="new title"
                      @cancel=${() => (this.showEditTitle = false)}
                      @accept=${(e) => this.editTitle(e.detail.value)}
                      ?loading=${this.updatingTitle}
                    ></uprtcl-form-string>
                  `
                : ''}
            </div>
            ${this.isMobile
              ? html`<div class="pages-summary">
                  <b>pages:</b>
                  ${this.renderPageList(false)}
                </div>`
              : html``}
          </div>

          <div class="context-menu">
            <uprtcl-help>
              <span>
                This Wiki is multi-perspective. <br /><br />It has one
                "official" perspective, and many different "personal"
                perspectives.<br /><br />
                The owner of the official perspective is shown below, under
                "Access Control".
              </span>
            </uprtcl-help>
            ${this.editable
              ? html`
                  <uprtcl-options-menu
                    .config=${contextConfig}
                    @option-click=${this.titleOptionClicked}
                  ></uprtcl-options-menu>
                `
              : ''}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    this.logger.log('render()', {
      wiki: this.wiki,
      uref: this.uref,
      editable: this.editable,
    });
    if (this.loading || !this.uref)
      return html` <cortex-loading-placeholder></cortex-loading-placeholder> `;

    return html`
      <div class="app-drawer">
        ${this.renderColorBar()}

        <div class="app-navbar">
          ${this.renderNavBar()}
        </div>

        <div class="app-content">
          ${this.selectedPageIx !== undefined
            ? html`
                <wiki-page
                  id="wiki-page"
                  @nav-back=${() => this.selectPage(undefined)}
                  @page-title-changed=${() => this.loadPagesData()}
                  pageHash=${this.wiki
                    ? this.wiki.object.pages[this.selectedPageIx]
                    : ''}
                  color=${this.color() ? this.color() : ''}
                  .editableRemotes=${this.editableRemotes}
                >
                </wiki-page>
              `
            : html`
                <div class="home-container">
                  ${this.renderSummary()}

                  <div class="evee-info">
                    <evees-info-page
                      slot="evee-page"
                      uref=${this.uref}
                      first-uref=${this.firstRef as string}
                      evee-color=${this.color()}
                      default-remote=${this.defaultRemoteId as string}
                    ></evees-info-page>
                  </div>
                </div>
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica,
            'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji',
            'Segoe UI Symbol';
          font-size: 1.6rem;
          color: #37352f;
          --mdc-theme-primary: #2196f3;
          width: 100%;
        }
        .app-drawer {
          flex: 1 1 0;
          display: flex;
          flex-direction: horizontal;
          padding-top: 5px;
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
        .column {
          height: 100%;
        }
        .color-bar {
          height: 1vw;
          max-height: 5px;
          flex-shrink: 0;
          width: 100%;
          position: absolute;
          top: 0px;
        }
        .nav-bar-top {
          display: flex;
          padding: 14px 10px 0px 0px;
          width: calc(100% - 10px);
          justify-content: space-between;
          border-color: #a2a8aa;
          border-bottom-style: solid;
          border-bottom-width: 1px;
        }
        .nav-bar-top .slash {
          margin-right: 6px;
        }
        .perspective-author-wrapper {
          width: 48px;
          height: 48px;
        }
        .nav-bar-top evees-author {
          cursor: pointer;
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
        }
        .page-item:hover {
          background-color: #e8ecec;
        }
        uprtcl-options-menu {
          padding-top: 6px;
          --box-with: 200px;
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
        .center-aligned {
          justify-content: center;
          align-items: center;
        }
        .button-row {
          width: calc(100% - 20px);
          padding: 16px 10px 8px 10px;
          display: flex;
        }
        .button-row uprtcl-button-loading {
          margin: 0 auto;
        }
        .app-top-nav {
          padding: 5px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .app-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }

        .home-container {
          text-align: center;
          height: auto;
        }

        .title-padding-div {
          width: 100%;
          height: 5vw;
          min-height: 32px;
        }

        .title-card-container {
          padding: 0px 5vw;
        }

        .section {
          text-align: center;
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
          box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.2);
          margin-bottom: 36px;
          border-radius: 4px;
          background-color: rgb(255, 255, 255, 0.6);
          position: relative;
        }
        .section-header {
          font-weight: bold;
          padding: 2vw 0px 0.8vw 0px;
          font-size: 3rem;
          border-style: solid 2px;
        }
        .section-content evees-author {
          display: inline-block;
          margin-left: 12px;
        }
        .section-content {
          padding-bottom: 2vw;
        }
        .official-name {
          font-size: 3rem;
          font-weight: bold;
          color: #4e585c;
        }
        .by-3box {
          color: rgb(99, 102, 104);
          font-weight: 600;
          letter-spacing: 0.015em;
        }
        .context-menu {
          position: absolute;
          top: 6px;
          right: 6px;
          display: flex;
        }
        .pages-summary {
          max-height: 150px;
          min-height: 80px;
          overflow-y: auto;
          text-align: left;
          color: gray;
          padding-left: 12px;
        }
        .title-form {
          margin-top: 22px;
        }

        @media (max-width: 768px) {
          .app-content {
            min-width: 100% !important;
          }
          .section {
            padding-top: 33px;
          }
        }
      `,
    ];
  }
}
