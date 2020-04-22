import { LitElement, property, html, css } from 'lit-element';
import { gql, ApolloClient } from 'apollo-boost';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Entity } from '@uprtcl/cortex';

import { Wiki } from '../types';

const LOGINFO = true;

interface PageDetails {ref: string, title: string};

export class WikiDiff extends moduleConnect(LitElement) {

  logger = new Logger('EVEES-DIFF');

  @property({ attribute: false })
  newData?: Entity<Wiki>;

  @property({ attribute: false })
  oldData?: Entity<Wiki>;

  @property({ attribute: false })
  loading: boolean = true;

  newPages?: PageDetails[];
  deletedPages?: PageDetails[];

  protected client: ApolloClient<any> | undefined = undefined;

  async firstUpdated() {
    this.logger.log('firstUpdated()', { newData: this.newData, oldData: this.oldData });
    this.client = this.request(ApolloClientModule.bindings.Client);

    this.loadChanges();
  }

  getPagesDetails(refs: string[]): Promise<PageDetails[]> {
    const client = this.client as ApolloClient<any>;

    const getDetails = refs.map(async (ref): Promise<PageDetails> => {
      const result = await client.query({
        query: gql`
          {
            entity(ref: "${ref}") {
              id
              _context {
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
          }`
        });

      return {
        ref,
        title: result.data.entity._context.content._context.patterns.title
      }
    });

    return Promise.all(getDetails);
  }

  async loadChanges() {
    this.loading = true;

    const newData = this.newData as Entity<Wiki>;
    const oldData = this.oldData as Entity<Wiki>;

    const newPagesRefs = newData.object.pages.filter(page => !oldData.object.pages.includes(page));
    const deletedPagesRefs = oldData.object.pages.filter(page => !newData.object.pages.includes(page));

    this.newPages = await this.getPagesDetails(newPagesRefs);
    this.deletedPages = await this.getPagesDetails(deletedPagesRefs);

    this.loading = false;
  }

  renderPage(page: PageDetails, classes: string[]) {
    return html`
      <div class=${['page-row'].concat(classes).join(' ')}>
        <documents-editor ref=${page.ref} editable="false"></documents-editor>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;
    }

    const newPages = this.newPages !== undefined ? this.newPages : [];
    const deletedPages = this.deletedPages !== undefined ? this.deletedPages : [];

    return html`
      ${newPages.length > 0 ? html`
        <div class="pages-list">
          <div class="page-list-title">Pages Added</div>
          ${newPages.map(page => this.renderPage(page, ['page-added']))}
        </div>` : ''}

      ${deletedPages.length > 0 ? html`
        <div class="pages-list">
          <div class="page-list-title">Pages Removed</div>
          ${deletedPages.map(page => this.renderPage(page, ['page-removed']))}
        </div>` : ''}
    `;
  }

  static get styles() {
    return css`
      :host {
        text-align: left;
      }
      .page-list-title {
        font-weight: bold;
        margin-bottom: 9px;
        color: gray;
      }
      .page-row {
        padding: 2vw;
        border-radius: 3px;
        margin-bottom: 16px;
      }
      .page-added {
        background-color: #abdaab;
      }
      .page-removed {
        background-color: #dab6ab;
      }
    `;
  }
}
