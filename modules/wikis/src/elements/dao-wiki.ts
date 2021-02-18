import { html, css, LitElement, property, internalProperty } from 'lit-element';

import { Logger, RecursiveContextMergeStrategy, servicesConnect } from '@uprtcl/evees';
import { styles } from '@uprtcl/common-ui';

export class DaoWiki extends servicesConnect(LitElement) {
  logger = new Logger('DAO-WIKI');

  @property({ type: String })
  uref!: string;

  @internalProperty()
  selectedPageId!: string;

  @internalProperty()
  hasChanges = false;

  firstUpdated() {
    this.checkChanges();
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener<any>('select-page', (e: CustomEvent) => {
      e.stopPropagation();
      this.selectedPageId = e.detail.uref;
    });
  }

  async checkChanges() {
    const forks = await this.evees.client.searchEngine.forks(this.uref);
    if (forks.length > 0) {
      const mergeEvees = this.evees.clone();
      const merger = new RecursiveContextMergeStrategy(mergeEvees);
      await merger.mergePerspectivesExternal(this.uref, forks[0], { forceOwner: true });
      const diff = await mergeEvees.client.diff();
      this.hasChanges = diff.updates.length > 0;
    }
  }

  renderHome() {
    return html`<h1>Home</h1>`;
  }

  render() {
    this.logger.log('rendering wiki after loading');

    return html`
      <div class="top-bar">
        ${this.hasChanges ? html`<uprtcl-button>propose changes</uprtcl-button>` : ''}
      </div>
      <div class="wiki-content-with-nav">
        <div class="wiki-navbar">
          <editable-page-list uref=${this.uref}></editable-page-list>
        </div>

        <div class="wiki-content">
          ${this.selectedPageId !== undefined
            ? html`
                <div class="page-container">
                  <documents-editor
                    id="doc-editor"
                    uref=${this.selectedPageId}
                    parent-id=${this.uref}
                    color=${'black'}
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
          flex: 1 1 auto;
          flex-direction: column;
        }
        .top-bar {
          flex: 0 0 auto;
          height: 70px;
          box-shadow: 1px 0px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          padding: 0rem 2rem;
        }
        .wiki-content-with-nav {
          flex: 1 1 auto;
          display: flex;
          flex-direction: row;
          position: relative;
          overflow: hidden;
        }
        .wiki-navbar {
          width: 260px;
          flex-shrink: 0;
          background: var(--white);
          box-shadow: 1px 0px 10px rgba(0, 0, 0, 0.1);
          z-index: 1;
          height: 100%;
        }
        .wiki-content {
          background: var(--background-color);
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }
      `,
    ];
  }
}
