import { html, css, internalProperty } from 'lit-element';

import { htmlToText, TextType, TextNode } from '@uprtcl/documents';
import { Logger } from '@uprtcl/micro-orchestrator';
import { styles } from '@uprtcl/common-ui';
import { HasTitle } from '@uprtcl/cortex';
import {
  EveesBaseElement,
  EveesHelpers,
  CONTENT_UPDATED_TAG,
  ContentUpdatedEvent,
} from '@uprtcl/evees';
import { MenuConfig } from '@uprtcl/common-ui';

import { Wiki } from '../types';

const MAX_LENGTH = 999;

interface PageData {
  id: string;
  title: string;
  draggingOver: boolean;
}

export class WikiDrawerContent extends EveesBaseElement<Wiki> {
  logger = new Logger('WIKI-DRAWER-CONTENT');

  @internalProperty()
  pagesList: PageData[] | undefined = undefined;

  @internalProperty()
  selectedPageIx: number | undefined = undefined;

  @internalProperty()
  creatingNewPage: boolean = false;

  @internalProperty()
  editableActual: boolean = false;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(CONTENT_UPDATED_TAG, ((e: ContentUpdatedEvent) => {
      if (e.detail.uref === this.uref) {
        this.logger.log('ContentUpdatedEvent()', this.uref);
        this.load();
      }
      if (
        this.pagesList &&
        this.pagesList.findIndex((page) => page.id === e.detail.uref) !== -1
      ) {
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
    this.data = undefined;
    this.logger.log('reset()', this.uref);
    this.loading = true;
    this.load();
    this.loading = false;
  }

  /** overwrite */
  async load() {
    await super.load();
    await this.loadPagesData();
  }

  async loadPagesData() {
    if (!this.data) {
      this.pagesList = [];
      return;
    }

    this.logger.log('loadPagesData()');

    const pagesListPromises = this.data.object.pages.map(
      async (pageId): Promise<PageData> => {
        const data = await EveesHelpers.getPerspectiveData(this.client, pageId);
        if (!data) throw new Error(`data not found for page ${pageId}`);
        const hasTitle: HasTitle = this.recognizer
          .recognizeBehaviours(data)
          .find((b) => (b as HasTitle).title);

        const title = hasTitle.title(data);

        return {
          id: pageId,
          title,
          draggingOver: false,
        };
      }
    );

    this.pagesList = await Promise.all(pagesListPromises);
    this.logger.log('loadPagesData()', { pagesList: this.pagesList });
  }

  selectPage(ix: number | undefined) {
    if (!this.data) return;
    this.selectedPageIx = ix;
  }

  handlePageDrag(e, ix) {
    if (!this.pagesList) throw new Error();
    const dragged = { uref: this.pagesList[ix].id, parentId: this.uref };
    this.logger.info('dragging', dragged);
    e.dataTransfer.setData('text/plain', JSON.stringify(dragged));
  }

  dragEnterOver(e, ix) {
    if (!this.pagesList) throw new Error();
    this.pagesList[ix].draggingOver = true;
    this.requestUpdate();
  }

  dragLeaveOver(e, ix) {
    if (!this.pagesList) throw new Error();
    this.pagesList[ix].draggingOver = false;
    this.requestUpdate();
  }

  async handlePageDrop(e) {
    const wikiObject = this.data
      ? this.data.object
      : {
          title: '',
          pages: [],
        };

    const dragged = JSON.parse(e.dataTransfer.getData('text/plain'));

    this.logger.info('dropped', dragged);

    if (!this.data) return;
    if (!dragged.uref) return;
    if (dragged.parentId === this.uref) return;

    const index = this.data.object.pages.length;

    await this.spliceChildrenAndUpdate(wikiObject, [dragged.uref], index, 0);
  }

  dragOverEffect(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  async replacePagePerspective(oldId, newId) {
    if (!this.data) throw new Error('wiki undefined');

    const ix = this.data.object.pages.findIndex((pageId) => pageId === oldId);

    if (ix === -1) return;

    await this.spliceChildrenAndUpdate(this.data.object, [newId], ix, 1);
  }

  async newPage(index?: number) {
    const wikiObject = this.data
      ? this.data.object
      : {
          title: '',
          pages: [],
        };

    this.creatingNewPage = true;

    const newPage: TextNode = {
      text: '',
      type: TextType.Title,
      links: [],
    };

    index = index === undefined ? wikiObject.pages.length : index;

    await this.spliceChildrenAndUpdate(wikiObject, [newPage], index, 0);

    this.selectPage(index);
    this.creatingNewPage = false;
  }

  async movePage(fromIndex: number, toIndex: number) {
    const entity = await super.moveChild(fromIndex, toIndex);
    await this.updateContent(entity.object);

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
    const entity = await super.removeEveeChild(pageIndex);
    await this.updateContent(entity.object);

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
    this.dispatchEvent(
      new CustomEvent('back', { bubbles: true, composed: true })
    );
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
        icon: 'arrow_upward',
      },
      'move-down': {
        disabled: ix === (this.pagesList as any[]).length - 1,
        text: 'move down',
        icon: 'arrow_downward',
      },
      'add-below': {
        disabled: false,
        text: 'create below',
        icon: 'add',
      },
      remove: {
        disabled: false,
        text: 'remove',
        icon: 'clear',
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
      <div class="page-item-row">
        <div
          class=${classes.join(' ')}
          draggable="true"
          @dragstart=${(e) => this.handlePageDrag(e, ix)}
          @dragenter=${(e) => this.dragEnterOver(e, ix)}
          @dragleave=${(e) => this.dragLeaveOver(e, ix)}
          @click=${() => this.selectPage(ix)}
        >
          <div class="text-container">
            ${text.length < MAX_LENGTH
              ? text
              : `${text.slice(0, MAX_LENGTH)}...`}
          </div>
          ${this.editableActual && showOptions
            ? html`
                <div class="item-menu-container">
                  <uprtcl-options-menu
                    class="options-menu"
                    @option-click=${(e) => this.optionOnPage(ix, e.detail.key)}
                    .config=${menuConfig}
                    skinny
                  >
                  </uprtcl-options-menu>
                </div>
              `
            : ''}
        </div>
        ${page.draggingOver
          ? html`<div class="title-dragging-over"></div>`
          : ''}
      </div>
    `;
  }

  renderHome() {
    return html`<div class="home-title" style=${`color: ${this.color}`}>
        Now seeing
      </div>
      <uprtcl-card>
        <evees-perspective-icon
          perspective-id=${this.uref}
        ></evees-perspective-icon>
      </uprtcl-card>`;
  }

  render() {
    if (this.loading) return html` <uprtcl-loading></uprtcl-loading> `;

    this.logger.log('rendering wiki after loading');

    return html`
      <div class="app-content-with-nav">
        <div
          class="app-navbar"
          @dragover=${this.dragOverEffect}
          @drop=${this.handlePageDrop}
        >
          ${this.renderPageList()}
        </div>

        <div class="app-content">
          ${this.selectedPageIx !== undefined && this.data
            ? html`
                <div class="page-container">
                  <documents-editor
                    id="doc-editor"
                    .client=${this.client}
                    uref=${this.data.object.pages[
                      this.selectedPageIx
                    ] as string}
                    parent-id=${this.uref}
                    color=${this.color}
                    .eveesInfoConfig=${this.eveesInfoConfig}
                  >
                  </documents-editor>
                </div>
              `
            : html` <div class="home-container">${this.renderHome()}</div> `}
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
        .page-item-row {
          position: relative;
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
        .title-dragging-over {
          position: absolute;
          bottom: -1px;
          height: 2px;
          background-color: #2196f3;
          width: 100%;
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
          margin: 0 auto;
          max-width: 900px;
          width: 100%;
          text-align: center;
          height: auto;
          padding: 6vw 0vw;
        }
        .home-container .home-title {
          font-size: 22px;
          font-weight: bold;
        }
        .home-container uprtcl-card {
          display: block;
          width: 340px;
          margin: 16px auto;
          padding: 12px 16px;
        }
      `,
    ];
  }
}
