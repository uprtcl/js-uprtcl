import { LitElement, property, html, css } from 'lit-element';
import { gql, ApolloClient } from 'apollo-boost';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { Entity } from '@uprtcl/cortex';

import { Wiki } from '../types';
import { EveesWorkspace } from '@uprtcl/evees';

const LOGINFO = true;

interface PageDetails {
  uref: string;
  title: string;
}

export class WikiDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ attribute: false })
  workspace!: EveesWorkspace;

  @property({ attribute: false })
  newData!: Entity<Wiki>;

  @property({ attribute: false })
  oldData!: Entity<Wiki>;

  @property({ attribute: false })
  loading: boolean = true;

  newPages!: string[];
  deletedPages!: string[];

  async firstUpdated() {
    this.logger.log('firstUpdated()', {
      newData: this.newData,
      oldData: this.oldData,
    });

    this.loadChanges();
  }

  async loadChanges() {
    this.loading = true;

    this.newPages = this.newData.object.pages.filter(
      (page) => !this.oldData.object.pages.includes(page)
    );
    this.deletedPages = this.oldData.object.pages.filter(
      (page) => !this.newData.object.pages.includes(page)
    );

    this.loading = false;
  }

  renderPage(page: string, classes: string[]) {
    return html`
      <div class=${['page-row'].concat(classes).join(' ')}>
        <documents-editor
          .client=${this.workspace.workspace}
          uref=${page}
          editable="false"
        ></documents-editor>
      </div>
    `;
  }

  renderTitleChange(title: string, classes: string[]) {
    return html`
      <div class=${['page-row'].concat(classes).join(' ')}>
        <h1>${title}</h1>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    const titleChanged =
      this.newData.object.title !== this.oldData.object.title;

    const newPages = this.newPages !== undefined ? this.newPages : [];
    const deletedPages =
      this.deletedPages !== undefined ? this.deletedPages : [];

    return html`
      ${titleChanged
        ? html`<div class="pages-list">
            <div class="page-list-title">New Title</div>
            ${this.renderTitleChange(this.newData.object.title, ['page-added'])}
            ${this.renderTitleChange(this.oldData.object.title, [
              'page-removed',
            ])}
          </div>`
        : ''}
      ${newPages.length > 0
        ? html` <div class="pages-list">
            <div class="page-list-title">Pages Added</div>
            ${newPages.map((page) => this.renderPage(page, ['page-added']))}
          </div>`
        : ''}
      ${deletedPages.length > 0
        ? html` <div class="pages-list">
            <div class="page-list-title">Pages Removed</div>
            ${deletedPages.map((page) =>
              this.renderPage(page, ['page-removed'])
            )}
          </div>`
        : ''}
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
