import { html, css, LitElement, property, internalProperty, query } from 'lit-element';

import {
  ClientEvents,
  Evees,
  EveesDiff,
  Logger,
  Proposal,
  RecursiveContextMergeStrategy,
  RemoteEvees,
  RemoteEveesLocal,
  servicesConnect,
} from '@uprtcl/evees';
import { MenuConfig, styles, UprtclPopper } from '@uprtcl/common-ui';

export class DaoWiki extends servicesConnect(LitElement) {
  logger = new Logger('DAO-WIKI');

  @property({ type: String })
  uref!: string;

  @query('#evees-update-diff')
  eveesDiff!: EveesDiff;

  @query('#proposals-popper')
  proposalsPopper!: UprtclPopper;

  @internalProperty()
  selectedPageId!: string;

  @internalProperty()
  isLogged = false;

  @internalProperty()
  canPropose = false;

  @internalProperty()
  hasChanges = false;

  @internalProperty()
  showChangesDialog = false;

  mergeEvees!: Evees;
  remote!: RemoteEvees;
  defaultRemote!: RemoteEvees;

  async firstUpdated() {
    this.remote = await this.evees.getPerspectiveRemote(this.uref);
    this.defaultRemote =
      this.evees.remotes.length > 1 ? this.evees.remotes[1] : this.evees.remotes[0];

    /** check changes every time the default remote is updated */
    if (this.defaultRemote.events) {
      this.defaultRemote.events.on(ClientEvents.updated, () => this.checkChanges());
    }

    this.checkChanges();
    this.checkLogin();
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener<any>('select-page', (e: CustomEvent) => {
      e.stopPropagation();
      this.selectedPageId = e.detail.uref;
    });
  }

  async checkChanges() {
    this.logger.log('CheckChanges()');
    const forks = await this.evees.client.searchEngine.forks(this.uref);
    if (forks.length > 0) {
      this.mergeEvees = this.evees.clone();
      const merger = new RecursiveContextMergeStrategy(this.mergeEvees);
      await merger.mergePerspectivesExternal(this.uref, forks[0], { forceOwner: true });
      const diff = await this.mergeEvees.client.diff();
      this.hasChanges = diff.updates.length > 0;
    }
  }

  async checkLogin() {
    this.isLogged = await this.remote.isLogged();
    this.canPropose =
      this.isLogged &&
      this.remote.proposals !== undefined &&
      (await this.remote.proposals.canPropose(this.uref));
  }

  async loginClicked() {
    if (!this.isLogged) {
      await this.remote.login();
    } else {
      await this.remote.logout();
    }
    this.checkLogin();
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
    if (e.detail.option === 'propose') {
      this.proposeMerge();
    }
  }

  async proposeMerge() {
    if (!this.evees.client.proposals) throw new Error('Proposals not defined');

    const mutation = await this.mergeEvees.client.diff();
    const proposal: Proposal = {
      toPerspectiveId: this.uref,
      mutation,
    };
    await this.evees.client.proposals.createProposal(proposal);
    await this.evees.client.flush();
  }

  renderHome() {
    return html`<h1>Home</h1>`;
  }

  renderProposals() {
    return html`
      <div class="list-container">
        <evees-proposals-list
          id="evees-proposals-list"
          perspective-id=${this.uref}
          @dialogue-closed=${() => (this.proposalsPopper.showDropdown = false)}
        ></evees-proposals-list>
      </div>
    `;
  }

  render() {
    this.logger.log('rendering wiki after loading');

    const updateDialogOptions: MenuConfig = {
      propose: {
        text: 'Propose',
      },
      close: {
        text: 'Close',
        skinny: true,
      },
    };
    return html`
      <div class="top-bar">
        <uprtcl-popper id="proposals-popper" position="bottom-left" class="proposals-popper">
          <uprtcl-button
            slot="icon"
            class="proposals-button"
            icon="arrow_drop_down"
            skinny
            transition
          >
            proposals
          </uprtcl-button>
          ${this.renderProposals()}
        </uprtcl-popper>
        <uprtcl-button @click=${() => this.loginClicked()}
          >${this.isLogged ? 'logout' : 'login'}</uprtcl-button
        >
        ${this.isLogged && !this.canPropose ? html`<span>can't make proposals :(</span>` : ``}
        ${this.hasChanges && this.canPropose
          ? html`<uprtcl-button @click=${() => this.showMergeDialog()}
              >propose changes</uprtcl-button
            >`
          : ''}
      </div>
      <div class="wiki-content-with-nav">
        <div class="wiki-navbar">
          <editable-page-list uref=${this.uref} ?editable=${this.canPropose}></editable-page-list>
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
