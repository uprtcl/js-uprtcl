import { html, css, property } from 'lit-element';
import { EveesInfoBase } from './evee-info-base';
import { Logger } from '@uprtcl/micro-orchestrator';

export class EveesPerspectives extends EveesInfoBase {
  logger = new Logger('EVEES-PERSPECTIVES');

  @property({ type: Array })
  hidePerspectives!: string[];

  async firstUpdated() {
    super.firstUpdated();
  }

  connectedCallback() {
    super.connectedCallback();
    this.logger.log('Connected', this.uref);
  }

  async disconnectedCallback() {
    super.disconnectedCallback();
    this.logger.log('Disconnected', this.uref);
  }

  render() {
    if (this.perspectiveData === undefined)
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;

    return html`
        ${
          this.isLoggedOnDefault
            ? html`
                <uprtcl-button-loading
                  skinny
                  icon="call_split"
                  @click=${this.newPerspectiveClicked}
                  loading=${this.creatingNewPerspective ? 'true' : 'false'}
                >
                  new perspective
                </uprtcl-button-loading>
              `
            : ''
        }
        <div class="list-container">
          ${
            !this.loading
              ? html`
                  <evees-perspectives-list
                    force-update=${this.forceUpdate}
                    perspective-id=${this.uref}
                    .hidePerspectives=${this.hidePerspectives}
                    ?can-propose=${this.isLogged}
                    @perspective-selected=${e => this.checkoutPerspective(e.detail.id)}
                    @merge-perspective=${e =>
                      this.otherPerspectiveMerge(e.detail.perspectiveId, this.uref)}
                  ></evees-perspectives-list>
                `
              : html`
                  <uprtcl-loading></uprtcl-loading>
                `
          }
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
          font-size: 30px;
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
      `
    ]);
  }
}
