import { html, css, LitElement, property, internalProperty, query } from 'lit-element';

import {
  ClientEvents,
  combineMutations,
  Evees,
  EveesDiffExplorer,
  Logger,
  Proposal,
  RecursiveContextMergeStrategy,
  RemoteEvees,
  RemoteLoggedEvents,
  servicesConnect,
} from '@uprtcl/evees';
import { MenuConfig, styles, UprtclPopper } from '@uprtcl/common-ui';
import { REMOVE_PAGE_EVENT_NAME } from './page-list-editable';

export const SELECT_PAGE_EVENT_NAME = 'select-page';

export class EditableWiki extends servicesConnect(LitElement) {
  logger = new Logger('DAO-WIKI');

  @property({ type: String })
  uref!: string;

  @query('#evees-diff-explorer')
  eveesDiff!: EveesDiffExplorer;

  @query('#proposals-popper')
  proposalsPopper!: UprtclPopper;

  @internalProperty()
  selectedPageId: string | undefined;

  @internalProperty()
  isLogged = false;

  @internalProperty()
  canPropose = false;

  @internalProperty()
  hasChanges = false;

  @internalProperty()
  showChangesDialog = false;

  @internalProperty()
  creatingProposal = false;

  mergeEvees: Evees | undefined;
  remote!: RemoteEvees;
  editRemote!: RemoteEvees;

  async firstUpdated() {
    this.remote = this.evees.remotes[0];
    this.editRemote = this.evees.remotes.length > 1 ? this.evees.remotes[1] : this.evees.remotes[0];

    /** check changes every time the default remote is updated */
    if (this.editRemote.events) {
      this.editRemote.events.on(ClientEvents.ecosystemUpdated, () => this.checkChanges());
    }

    if (this.remote.events) {
      this.remote.events.on(RemoteLoggedEvents.logged_status_changed, () => this.reload());
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener<any>(SELECT_PAGE_EVENT_NAME, (e: CustomEvent) => {
      this.selectedPageId = e.detail.uref;
    });

    this.addEventListener<any>(REMOVE_PAGE_EVENT_NAME, (e: CustomEvent) => {
      if (this.selectedPageId === e.detail.uref) {
        this.selectedPageId = undefined;
      }
    });
  }

  async reload() {
    await this.checkLogin();
    await this.checkChanges();
  }

  async checkChanges() {
    if (!this.isLogged) {
      this.mergeEvees = undefined;
      this.hasChanges = false;
      return;
    }

    this.logger.log('CheckChanges()');

    if (!this.evees.client.searchEngine) {
      throw new Error('Search engine undefined');
    }

    const forks = await this.evees.client.searchEngine.forks(this.uref, { levels: -1 });

    if (forks.length > 0) {
      // build
      const mutations = await Promise.all(
        forks.map(async (fork) => {
          const mergeEvees = this.evees.clone(`TempMergeClientFor-${fork.forkId}`);
          const merger = new RecursiveContextMergeStrategy(mergeEvees);
          await merger.mergePerspectivesExternal(fork.ofPerspectiveId, fork.forkId, {
            forceOwner: true,
          });

          return mergeEvees.client.diff();
        })
      );

      const mutation = combineMutations(mutations);

      this.mergeEvees = this.evees.clone('WikiMergeClient');
      await this.mergeEvees.update(mutation);
      this.hasChanges = mutation.updates.length > 0;
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
    if (!this.mergeEvees) throw new Error('this.mergeEvees undefined');
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
      this.showChangesDialog = false;
      this.proposeMerge();
    }
  }

  async proposeMerge() {
    if (!this.evees.client.proposals) throw new Error('Proposals not defined');
    if (!this.mergeEvees) throw new Error('mergeEvees not defined');

    this.creatingProposal = true;

    const mutation = await this.mergeEvees.client.diff();

    const proposal: Proposal = {
      toPerspectiveId: this.uref,
      mutation,
    };

    await this.evees.client.proposals.createProposal(proposal);
    await this.evees.client.flush();

    // TBD if we should wipe local changes after proposal was created
    // const casRemote = this.evees.getCASRemote(this.editRemote.casID);
    // if (casRemote.clear) await casRemote.clear();
    // if (this.editRemote.clear) await this.editRemote.clear();

    this.creatingProposal = false;
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

  renderTopBar() {
    return html`<div class="top-bar">
      <div class="proposals-container">
        <uprtcl-popper id="proposals-popper" position="bottom-left" class="proposals-popper">
          <uprtcl-button slot="icon" class="proposals-button"> open proposals </uprtcl-button>
          ${this.renderProposals()}
        </uprtcl-popper>
      </div>
      <div class="propose-container">
        ${this.hasChanges && this.canPropose
          ? html`<uprtcl-button @click=${() => this.showMergeDialog()}
              >propose changes</uprtcl-button
            >`
          : ''}${this.isLogged && !this.canPropose
          ? html`<span>can't make proposals :(</span>`
          : ``}
      </div>
      <div class="login-container">
        ${!this.isLogged
          ? html`<uprtcl-button @click=${() => this.loginClicked()}>login</uprtcl-button>`
          : html`<evees-author user-id=${this.remote.userId as string}></evees-author>`}
      </div>

      <div class="snackbar-container">
        ${this.creatingProposal ? html`<uprtcl-loading></uprtcl-loading>` : ''}
      </div>
    </div>`;
  }

  render() {
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
      ${this.renderTopBar()}
      <div class="wiki-content-with-nav">
        <div class="wiki-navbar">
          <editable-page-list
            first-uref=${this.uref}
            ?editable=${this.canPropose}
          ></editable-page-list>
        </div>

        <div class="wiki-content">
          ${this.selectedPageId !== undefined
            ? html`
                <div class="page-container">
                  <editable-document-editor
                    first-uref=${this.selectedPageId}
                  ></editable-document-editor>
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
            <evees-diff-explorer
              id="evees-diff-explorer"
              perspective-id=${this.uref}
            ></evees-diff-explorer>
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
          display: flex;
          height: 70px;
          box-shadow: 1px 0px 10px rgba(0, 0, 0, 0.1);
          align-items: center;
          padding: 0rem 2rem;
        }
        .proposals-container {
          flex: 0 0 auto;
        }

        .propose-container {
          flex: 1 0 auto;
          display: flex;
          justify-content: center;
        }

        .propose-container uprtcl-button {
          width: 200px;
        }

        .login-container {
          flex: 0 0 auto;
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
