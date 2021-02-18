import { html, css, LitElement, property, internalProperty } from 'lit-element';

import { Logger, servicesConnect } from '@uprtcl/evees';
import { styles } from '@uprtcl/common-ui';

export class DaoWiki extends servicesConnect(LitElement) {
  logger = new Logger('DAO-WIKI');

  @property({ type: String })
  uref!: string;

  @internalProperty()
  selectedPageId!: string;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener<any>('select-page', (e: CustomEvent) => {
      e.stopPropagation();
      this.selectedPageId = e.detail.uref;
    });
  }

  renderHome() {
    return html`<h1>Home</h1>`;
  }

  render() {
    this.logger.log('rendering wiki after loading');

    return html`
      <div class="app-content-with-nav">
        <div class="app-navbar">
          <editable-page-list uref=${this.uref}></editable-page-list>
        </div>

        <div class="app-content">
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
          flex: 1 1 0;
          flex-direction: column;
        }
        .app-content-with-nav {
          flex: 1 1 0;
          display: flex;
          flex-direction: row;
          position: relative;
          overflow: hidden;
        }
        .app-navbar {
          width: 260px;
          flex-shrink: 0;
          background: var(--white);
          box-shadow: 1px 0px 10px rgba(0, 0, 0, 0.1);
          z-index: 1;
          height: 100%;
        }
        .app-content {
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
