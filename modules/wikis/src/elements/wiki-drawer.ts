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


import { htmlToText, TextType, DocumentsModule, TextNode, DocumentsBindings } from '@uprtcl/documents';
import { Logger, moduleConnect } from '@uprtcl/micro-orchestrator';
import { sharedStyles } from '@uprtcl/lenses';
import { Hashed, Pattern, Creatable, Signed } from '@uprtcl/cortex';
import { MenuConfig, EveesRemote, EveesModule, RemotesConfig, EveesBindings, eveeColor, DEFAULT_COLOR, CreateCommitArgs, Commit, Secured, UPDATE_HEAD } from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Source } from '@uprtcl/multiplatform';

import { Wiki } from '../types';

import '@material/mwc-drawer';
import { WikiBindings } from 'src/bindings';

const LOGINFO = false;

export class WikiDrawer extends moduleConnect(LitElement) {
  
  logger = new Logger('WIKI-DRAWER');

  @property({ type: String, attribute: 'ref' })
  firstRef: string | undefined = undefined;

  @property({ type: String, attribute: false })
  ref: string | undefined = undefined;

  @property({ type: Object, attribute: false })
  wiki: Hashed<Wiki> | undefined;

  @property({ type: Number })
  selectedPageIx: number | undefined = undefined;

  @property({ type: Object, attribute: false })
  pagesList: Array<{ title: string; id: string }> | undefined = undefined;

  authority: string = '';
  currentHeadId: string | undefined = undefined;
  editable: boolean = false;
  
  protected client: ApolloClient<any> | undefined = undefined;
  protected eveesRemotes: EveesRemote[] | undefined = undefined;
  protected remotesConfig: RemotesConfig | undefined = undefined;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.eveesRemotes = this.requestAll(EveesModule.bindings.EveesRemote);
    this.remotesConfig = this.request(EveesModule.bindings.RemotesConfig);

    this.ref = this.firstRef;
    this.logger.log('firstUpdated()', { ref: this.ref });

    this.loadWiki();
  }

  updated(changedProperties) {
    if (changedProperties.has('ref')) {
      if (changedProperties.get('ref') !== undefined) {
        this.loadWiki();
      }
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
    const client = this.client as ApolloClient<any>;

    const result = await client.query({
      query: gql`
      {
        entity(id: "${this.ref}") {
          id
          ... on Perspective {
            payload {
              origin
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

    this.authority = result.data.entity.payload.origin;
    this.currentHeadId = result.data.entity.head.id;
    this.editable = result.data.entity._context.patterns.accessControl.canWrite;
    this.wiki = {
      id: result.data.entity.head.data.id,
      object: {
        title: result.data.entity.head.data.title,
        pages: result.data.entity.head.data.pages.map(p => p.id)
      }
    }

    this.logger.log('loadWiki()', { this: this, result });

    this.loadPagesData();

    this.requestUpdate();
  }

  async loadPagesData() {
    if (!this.wiki) return;

    this.logger.log('loadPagesData()');
    
    const pagesListPromises = this.wiki.object.pages.map(async pageId => {
      if (!this.client) throw new Error('client is undefined');
      const result = await this.client.query({
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

  getPatternOfSymbol<T>(symbol: string, name: string) {
    if (LOGINFO) this.logger.log(`getPatternOfSymbol(${symbol.toString()})`);

    const patterns: Pattern[] = this.requestAll(symbol);
    const create: T | undefined = (patterns.find(
      pattern => ((pattern as unknown) as T)[name]
    ) as unknown) as T;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
  }

  getStore(eveesAuthority: string): Source | undefined {
    if (!this.remotesConfig) return undefined;
    return this.remotesConfig.map(eveesAuthority);
  }

  async createPage(page: TextNode, authority: string) {
    if (!this.eveesRemotes) throw new Error('eveesRemotes undefined');
    const remote = this.eveesRemotes.find(r => r.authority === authority);

    if (!remote) throw new Error(`Remote not found for authority ${authority}`);

    const creatable = this.getPatternOfSymbol<Creatable<any,any>>(DocumentsBindings.TextNodeEntity, 'create');
    const store = this.getStore(authority);
    if (!store) throw new Error('store is undefined');
    const object = await creatable.create()(page, store.source);

    const creatableCommit = this.getPatternOfSymbol<Creatable<CreateCommitArgs, Signed<Commit>>>(EveesBindings.CommitPattern, 'create');
    const commit = await creatableCommit.create()(
      { parentsIds: [], dataId: object.id },
      remote.source
    );

    const creatablePerspective = this.getPatternOfSymbol<Creatable<any,any>>(EveesBindings.PerspectivePattern, 'create');
    const perspective = await creatablePerspective.create()(
      { fromDetails: { headId: commit.id } , parentId: this.ref },
      authority
    );

    return perspective.id;
  }

  async updateContent(newWiki: Wiki) {
    const client = this.client as ApolloClient<any>;
    const eveesRemotes = this.eveesRemotes as EveesRemote[];
    const remote = eveesRemotes.find(r => r.authority === this.authority);
    if (!remote) throw Error(`Remote not found for authority ${this.authority}`);

    const creatable = this.getPatternOfSymbol<Creatable<any,any>>(WikiBindings.WikiEntity, 'create');
    const store = this.getStore(this.authority);
    if (!store) throw Error(`Store not found for authority ${this.authority}`);

    const createdWiki = await creatable.create()(newWiki, store.source);

    const creatableCommit = this.getPatternOfSymbol<Creatable<CreateCommitArgs, Signed<Commit>>>(EveesBindings.CommitPattern, 'create');
    const commit: Secured<Commit> = await creatableCommit.create()(
      { 
        parentsIds: this.currentHeadId ? [this.currentHeadId] : [], 
        dataId: createdWiki.id 
      },
      remote.source
    );

    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.ref,
        headId: commit.id
      }
    });

    this.currentHeadId = commit.id;
    
    this.logger.info('updateContent()', {createdWiki});

    this.loadWiki();
  }

  async splicePages(pages: any[], index: number, count: number) {
    if (!this.wiki) return { entity: undefined, removed: [] };

    const getPages = pages.map((page) => {
      if (typeof page !== 'string') {
        return this.createPage(page, this.authority);
      } else {
        return Promise.resolve(page);
      }
    });

    const pagesIds = await Promise.all(getPages);

    const newObject = {...this.wiki.object};
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
    await this.splicePages(removed as string[], fromIndex, 1);
    
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
    this.splicePages([], pageIndex, 1);

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
        this.removePage(pageIndex)
        break;
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      this.ref = event.detail.perspectiveId;
    })  as EventListener);
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
          const menuConfig: MenuConfig = {
            'move-up': {
              disabled: ix === 0,
              text: 'move up',
              graphic: 'arrow_upward'
            },
            'move-down': {
              disabled: ix === ((this.pagesList as any[]).length - 1),
              text: 'move down',
              graphic: 'arrow_downward'
            },
            'remove': {
              disabled: false,
              text: 'remove',
              graphic: 'clear'
            },
          }
          // this.logger.log(`rendering page title ${page.id}`, menuConfig);
          const text = htmlToText(page.title);
          const empty = text === '';
          const selected = this.selectedPageIx === ix;

          let classes: string[] = [];

          if (empty) classes.push('title-empty');
          if (selected) classes.push('title-selected');

          return html`
            <evees-list-item 
              class=${classes.join(' ')}
              text=${empty ? 'untitled' : text}
              selected=${selected ? 'true' : 'false'}
              @item-click=${() => this.selectPage(ix)}
              @option-click=${(e) => this.optionOnPage(ix, e.detail.option)}
              .config=${menuConfig}>
            </evees-list-item>
          `;
        })}
      </mwc-list>
    `;
  }

  render() {
    this.logger.log('render()', { wiki: this.wiki, ref: this.ref, editable: this.editable });
    if (!this.wiki || !this.ref)
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

        <div slot="appContent" class="app-content">
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
                  color=${this.color ? this.color : ''}
                >
                  <evees-info-page 
                    slot="evee-page"
                    first-perspective-id=${this.firstRef as string}
                    perspective-id=${this.ref}
                    evee-color=${this.color()}
                  ></evees-info-page>
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
          --mdc-theme-primary: #2196F3;
        }
        .app-content {
          height: 100%;
          width: 100%;
          flex: 1 1 0;
          overflow: auto;
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
        .title-empty {
          color: #a2a8aa;
          font-style: italic;
        }
        .title-selected {
          font-weight: bold;
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
