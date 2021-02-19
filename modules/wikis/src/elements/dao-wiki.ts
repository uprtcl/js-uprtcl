import { html, css, LitElement, property, internalProperty, query } from 'lit-element';

import {
  Evees,
  EveesDiff,
  Logger,
  RecursiveContextMergeStrategy,
  servicesConnect,
} from '@uprtcl/evees';
import { MenuConfig, styles } from '@uprtcl/common-ui';

export class DaoWiki extends servicesConnect(LitElement) {
  logger = new Logger('DAO-WIKI');

  @property({ type: String })
  uref!: string;

  @query('#evees-update-diff')
  eveesDiff!: EveesDiff;

  @internalProperty()
  selectedPageId!: string;

  @internalProperty()
  hasChanges = false;

  @internalProperty()
  showChangesDialog = false;

  mergeEvees!: Evees;

  firstUpdated() {
    this.checkChanges();
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener<any>('select-page', (e: CustomEvent) => {
      e.stopPropagation();
      this.selectedPageId = e.detail.uref;
    });

    // this.addEventListener<any>('option-selected', (e: CustomEvent) => {
    //   e.stopPropagation();
    //   this.dialogOptionSelected(e);
    // });
  }

  async checkChanges() {
    const forks = await this.evees.client.searchEngine.forks(this.uref);
    if (forks.length > 0) {
      this.mergeEvees = this.evees.clone();
      const merger = new RecursiveContextMergeStrategy(this.mergeEvees);
      await merger.mergePerspectivesExternal(this.uref, forks[0], { forceOwner: true });
      const diff = await this.mergeEvees.client.diff();
      this.hasChanges = diff.updates.length > 0;
    }
  }

  async showMergeDialog() {
    this.showChangesDialog = true;
    await this.updateComplete;

    // inject the merge workspace as the dialog context
    this.eveesDiff.localEvees = this.mergeEvees;
    this.eveesDiff.loadUpdates();
  }

  dialogOptionSelected(e: CustomEvent) {
    if (e.detail.option === 'close') {
      this.showChangesDialog = false;
    }
  }

  renderHome() {
    return html`<h1>Home</h1>`;
  }

  render() {
    this.logger.log('rendering wiki after loading');

    const updateDialogOptions: MenuConfig = {
      close: {
        text: 'close',
      },
    };
    return html`
      <div class="top-bar">
        ${this.hasChanges
          ? html`<uprtcl-button @click=${() => this.showMergeDialog()}
              >propose changes</uprtcl-button
            >`
          : ''}
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
      ${this.showChangesDialog
        ? html`<uprtcl-dialog
            id="updates-dialog"
            .options=${updateDialogOptions}
            @option-selected=${this.dialogOptionSelected}
          >
            <evees-update-diff id="evees-update-diff"></evees-update-diff>
          </uprtcl-dialog>`
        : ''}
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
