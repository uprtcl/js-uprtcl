import { html, css, property, query } from 'lit-element';
const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(
      /([A-Z])/g,
      (matches) => `-${matches[0].toLowerCase()}`
    );
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { MenuConfig } from '@uprtcl/common-ui';

import { EveesInfoBase } from './evee-info-base';
import { UPDATE_HEAD } from '../graphql/queries';
import { ApolloClient } from 'apollo-boost';

export class EveesInfoPage extends EveesInfoBase {
  @property({ attribute: false })
  showEditName: boolean = false;

  @query('#draft-textfield')
  draftTextField!: any;

  async firstUpdated() {
    super.firstUpdated();
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keydown', (event) => {
      if (event.keyCode === 27) {
        // 27 is esc
        this.showEditName = false;
      }

      if (event.keyCode === 13) {
        // 13 is enter
        if (this.showEditName) {
          this.saveName();
        }
      }
    });
  }

  async editNameClicked() {
    this.showEditName = true;
    await this.updateComplete;
    this.draftTextField.focus();
  }

  async saveName() {
    if (!this.shadowRoot) return;
    const client = this.client as ApolloClient<any>;
    const newName = this.draftTextField.value;

    this.showEditName = false;

    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.uref,
        name: newName,
      },
    });

    this.load();
  }

  optionClicked(e) {
    switch (e.detail.key) {
      case 'logout':
        this.logout();
        break;

      case 'login':
        this.login();
        break;

      case 'edit-profile':
        if (this.defaultRemote) {
          window.open(`https://3box.io/${this.defaultRemote.userId}`);
        }
        break;

      case 'edit':
        this.editNameClicked();
        break;
    }
  }

  async showPullChanges() {
    const confirm = await this.updatesDialog(
      this.pullWorkspace,
      'apply',
      'close'
    );

    if (!confirm) {
      return;
    }

    await this.applyWorkspace(this.pullWorkspace);

    this.checkoutPerspective(this.uref);
  }

  renderPermissions() {
    return html`
      <div class="perspectives-permissions">
        ${!this.loading
          ? this.remote.accessControl.lense().render(this.uref)
          : ''}
      </div>
    `;
  }

  renderNewPerspectiveButton() {
    return html`
      <uprtcl-button-loading
        class="section-button"
        skinny
        icon="call_split"
        @click=${this.newPerspectiveClicked}
        loading=${this.creatingNewPerspective ? 'true' : 'false'}
      >
        new perspective
      </uprtcl-button-loading>
    `;
  }

  renderMakeProposalButton() {
    return html`
      <uprtcl-button-loading
        class="section-button"
        skinny
        icon="call_merge"
        @click=${this.proposeMergeClicked}
        loading=${this.proposingUpdate ? 'true' : 'false'}
      >
        Propose Merge
      </uprtcl-button-loading>
    `;
  }

  renderPerspectiveActions() {
    /** most likely action button */
    const actionButton = html`
        ${
          this.isLogged && this.firstRef !== this.uref
            ? html`<div class="action-button">
                ${this.renderMakeProposalButton()}
              </div>`
            : this.isLoggedOnDefault
            ? html`<div class="action-button">
                ${this.renderNewPerspectiveButton()}
              </div>`
            : ''
        }
      </div>
    `;

    const contextButton = html`
      <div class="context-menu">
        <uprtcl-help>
          <span>
            To update the "Official Version" of this Wiki you need to create a
            new "Perspective"<br /><br />
            Once changes have been made to that perspectective, click "Propose
            Update" to update the "Official" perspective.
          </span>
        </uprtcl-help>
      </div>
    `;

    const pullButton = html`
      <div class="pull-menu">
        <uprtcl-icon-button @click=${this.showPullChanges} icon="play_for_work">
        </uprtcl-icon-button>
      </div>
    `;

    return html`
      ${this.showEditName ? '' : actionButton} ${contextButton}
      ${this.firstHasChanges ? pullButton : ''}
    `;
  }

  render() {
    if (this.perspectiveData === undefined) return html``;
    return html`
      <div class="container">
        <div class="column">
          <div class="section">
            <div class="section-header perspective-title">
              Perspectives
            </div>

            <div class="section-content">
              ${this.renderPerspectiveActions()}
              <div class="list-container">
                <evees-perspectives-list
                  force-update=${this.forceUpdate}
                  perspective-id=${this.uref}
                  first-perspective-id=${this.firstRef}
                  ?can-propose=${this.isLogged}
                  @perspective-selected=${(e) =>
                    this.checkoutPerspective(e.detail.id)}
                  @merge-perspective=${(e) =>
                    this.otherPerspectiveMerge(
                      e.detail.perspectiveId,
                      this.uref,
                      false
                    )}
                  @create-proposal=${(e) =>
                    this.otherPerspectiveMerge(
                      e.detail.perspectiveId,
                      this.uref,
                      true
                    )}
                ></evees-perspectives-list>
              </div>
            </div>
          </div>

          ${this.uref === this.firstRef
            ? html`<div class="section">
                <div class="section-header">
                  Proposals
                </div>

                <div class="section-content">
                  <div class="list-container">
                    <evees-proposals-list
                      force-update=${this.forceUpdate}
                      perspective-id=${this.uref}
                      @authorize-proposal=${this.authorizeProposal}
                      @execute-proposal=${this.executeProposal}
                    ></evees-proposals-list>
                  </div>
                </div>
              </div>`
            : ''}
          ${true
            ? html`
                <div class="section">
                  <div class="section-header">
                    Access Control
                  </div>
                  <div class="section-content">
                    ${this.renderPermissions()}
                  </div>
                  <div class="context-menu"></div>
                </div>
              `
            : ''}

          <!-- <div class="section">
            <div class="section-header">
              Evee Info
            </div>
            <div class="section-content info-text">
              ${this.renderInfo()}
            </div>
          </div> -->
        </div>
      </div>
      ${this.showUpdatesDialog ? this.renderUpdatesDialog() : ''}
    `;
  }

  static get styles() {
    return super.styles.concat([
      css`
        .section-button {
          width: 220px;
          margin: 0 auto;
        }

        p {
          margin: 0;
        }
        .column {
          display: flex;
          flex-direction: column;
          padding: 0px 5vw;
        }
        .section {
          text-align: center;
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
          box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.2);
          margin-bottom: 36px;
          border-radius: 4px;
          background-color: rgb(255, 255, 255, 0.6);
          position: relative;
        }
        .user-icon {
          padding-top: 8px;
          width: 48px;
          height: 48px;
          cursor: pointer;
        }
        .section-header {
          font-weight: bold;
          padding: 2vw 0px 0.8vw 0px;
          font-size: 3rem;
          border-style: solid 2px;
        }
        .section-header evees-author {
          margin: 0 auto;
        }
        .context-menu {
          position: absolute;
          top: 6px;
          right: 6px;
          display: flex;
        }
        .pull-menu {
          position: absolute;
          top: 6px;
          left: 6px;
        }
        .section-content {
          padding: 2.2vw 0px 2.2vw 0px;
        }
        .info-text {
          color: #4e585c;
          padding: 0px 2.5vw;
          min-height: 75px;
        }
        .action-button {
          margin-bottom: 24px;
        }
        .list-container {
          min-height: 200px;
          display: flex;
          flex-direction: column;
          text-align: left;
          padding: 6px 12px 0px 16px;
          color: #4e585c;
        }

        @media (max-width: 768px) {
          .section-header {
            margin-top: 33px;
          }
          .context-menu {
            top: 2px;
            right: 5px;
          }
          .pull-menu {
            top: 2px;
            left: 5px;
          }
          .mdc-icon-button {
            width: 35px !important;
            height: 35px !important;
          }
          .draft-mod-action uprtcl-button {
            margin-bottom: 10px;
          }
          .draft-name uprtcl-textfield {
            width: 85%;
          }
        }
      `,
    ]);
  }
}
