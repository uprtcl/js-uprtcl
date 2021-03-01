import { Client, Evees, Logger, servicesConnect } from '@uprtcl/evees';
import { LitElement, property, html, css } from 'lit-element';

import { Wiki } from '../types';

const LOGINFO = true;

interface PageDetails {
  uref: string;
  title: string;
}

export class WikiDiff extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ type: Boolean })
  summary = false;

  @property({ attribute: false })
  newData!: Wiki;

  @property({ attribute: false })
  oldData!: Wiki;

  @property({ attribute: false })
  loading = true;

  localEvees!: Evees;

  newPages!: string[];
  deletedPages!: string[];
  oldTitle = '';

  async firstUpdated() {
    this.logger.log('firstUpdated()', {
      newData: this.newData,
      oldData: this.oldData,
    });

    this.loadChanges();
  }

  async loadChanges() {
    this.loading = true;

    const oldPages = this.oldData ? this.oldData.pages : [];
    this.oldTitle = this.oldData ? this.oldData.title : '';

    this.newPages = await Promise.all(
      this.newData.pages
        .filter((page) => (this.oldData ? !oldPages.includes(page) : true))
        .map((page) => this.getTitle(page))
    );

    this.deletedPages = await Promise.all(
      oldPages
        .filter((page) => !this.newData.pages.includes(page))
        .map((page) => this.getTitle(page))
    );

    this.loading = false;
  }

  async getTitle(uref: string): Promise<string> {
    const data = await this.localEvees.getPerspectiveData(uref);
    return this.localEvees.behaviorFirst(data.object, 'title');
  }

  renderPage(title: string, classes: string[]) {
    return html` <div class=${['page-row'].concat(classes).join(' ')}>${title}</div> `;
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

    const titleChanged = this.newData.title !== this.oldTitle;

    const newPages = this.newPages !== undefined ? this.newPages : [];
    const deletedPages = this.deletedPages !== undefined ? this.deletedPages : [];

    if (this.summary) {
      return html`
        ${newPages.length ? html` <span>${newPages.length} new pages added,</span> ` : ''}
        ${deletedPages.length ? html` <span>${deletedPages.length} pages deleted.</span> ` : ''}
      `;
    }

    return html`
      ${titleChanged
        ? html`
            <div class="pages-list">
              <div class="page-list-title">New Title</div>
              ${this.renderTitleChange(this.newData.title, ['green-background'])}
              ${this.renderTitleChange(this.oldTitle, ['red-background'])}
            </div>
          `
        : ''}
      ${newPages.length > 0
        ? html`
            <div class="pages-list">
              <div class="page-list-title">Pages Added</div>
              ${newPages.map((title) => this.renderPage(title, ['green-background']))}
            </div>
          `
        : ''}
      ${deletedPages.length > 0
        ? html`
            <div class="pages-list">
              <div class="page-list-title">Pages Removed</div>
              ${deletedPages.map((title) => this.renderPage(title, ['red-background']))}
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
