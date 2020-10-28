import { LitElement, property, html, css } from 'lit-element';

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

  @property({ type: Boolean })
  summary: boolean = false;

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
  oldTitle: string = '';

  async firstUpdated() {
    this.logger.log('firstUpdated()', {
      newData: this.newData,
      oldData: this.oldData
    });

    this.loadChanges();
  }

  async loadChanges() {
    this.loading = true;

    const oldPages = this.oldData ? this.oldData.object.pages : [];
    this.oldTitle = this.oldData ? this.oldData.object.title : '';

    this.newPages = this.newData.object.pages.filter(page =>
      this.oldData ? !oldPages.includes(page) : true
    );
    this.deletedPages = this.oldData
      ? oldPages.filter(page => !this.newData.object.pages.includes(page))
      : [];

    this.loading = false;
  }

  renderPage(page: string, classes: string[]) {
    return html`
      <div class=${['page-row'].concat(classes).join(' ')}>
        <documents-editor
          .client=${this.workspace.workspace}
          uref=${page}
          read-only
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
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;
    }

    const titleChanged = this.newData.object.title !== this.oldTitle;

    const newPages = this.newPages !== undefined ? this.newPages : [];
    const deletedPages = this.deletedPages !== undefined ? this.deletedPages : [];

    if (this.summary) {
      return html`
        ${titleChanged
          ? html`
              <span class="">Title changed, </span>
            `
          : ''}
        ${newPages.length
          ? html`
              <span>${newPages.length} new pages added,</span>
            `
          : ''}
        ${deletedPages.length
          ? html`
              <span>${deletedPages.length} pages deleted.</span>
            `
          : ''}
      `;
    }

    return html`
      ${titleChanged
        ? html`
            <div class="pages-list">
              <div class="page-list-title">New Title</div>
              ${this.renderTitleChange(this.newData.object.title, ['green-background'])}
              ${this.renderTitleChange(this.oldTitle, ['red-background'])}
            </div>
          `
        : ''}
      ${newPages.length > 0
        ? html`
            <div class="pages-list">
              <div class="page-list-title">Pages Added</div>
              ${newPages.map(page => this.renderPage(page, ['green-background']))}
            </div>
          `
        : ''}
      ${deletedPages.length > 0
        ? html`
            <div class="pages-list">
              <div class="page-list-title">Pages Removed</div>
              ${deletedPages.map(page => this.renderPage(page, ['red-background']))}
            </div>
          `
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
      .green-background {
        background-color: #abdaab;
      }
      .red-background {
        background-color: #dab6ab;
      }
    `;
  }
}
