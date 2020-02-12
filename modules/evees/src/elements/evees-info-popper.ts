import { html, css, property } from 'lit-element';
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { EveesInfoBase } from './evee-info-base';
import { DEFAULT_COLOR } from './evees-perspective';
import { prettyAddress, prettyTime } from './support';

export class EveesInfoPopper extends EveesInfoBase {
  @property({ attribute: false })
  show: Boolean = false;

  firstUpdated() {
    this.load();
  }

  showClicked() {
    this.show = !this.show;
    if (this.show) this.load();
  }

  async newPerspectiveClicked() {
    super.newPerspectiveClicked();
    this.show = false;
  }

  perspectiveTitle() {
    if (this.perspectiveId === this.firstPerspectiveId) {
      return 'Accepted Perspective (on the parent)';
    } else {
      return `Another Perspective`;
    }
  }

  renderInfo() {
    return html`
      <div class="perspective-details">
        <p class="summary">
          This Evee was created by ${prettyAddress(this.perspectiveData.perspective.creatorId)}
          ${prettyTime(this.perspectiveData.perspective.timestamp)}
        </p>

        <div class="technical-details">
          <div class="card-container">
            <div class="card tech-card">
              <table class="tech-table">
                <tr>
                  <td class="prop-name">perspective-id:</td>
                  <td class="prop-value">${this.perspectiveData.id}</td>
                </tr>
                <tr>
                  <td class="prop-name">context:</td>
                  <td class="prop-value">${this.perspectiveData.details.context}</td>
                </tr>
                <tr>
                  <td class="prop-name">origin:</td>
                  <td class="prop-value">${this.perspectiveData.perspective.origin}</td>
                </tr>
                <tr>
                  <td class="prop-name">head:</td>
                  <td class="prop-value">${this.perspectiveData.details.headId}</td>
                </tr>
                <tr>
                  <td class="prop-name">data:</td>
                  <td class="prop-value">${this.perspectiveData.data.id}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderOtherPerspectives() {
    return html`
      <div class="perspectives-list">
        <evees-perspectives-list
          perspective-id=${this.perspectiveId}
          first-perspective-id=${this.firstPerspectiveId}
          @perspective-selected=${this.otherPerspectiveClicked}
          @merge-perspective=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, false)}
          @create-proposal=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, true)}
          @authorize-proposal=${this.authorizeProposal}
          @execute-proposal=${this.executeProposal}
        ></evees-perspectives-list>
      </div>
      <div class="button-row">
        ${this.loading
          ? this.renderLoading()
          : html`
              <mwc-button
                outlined
                icon="call_split"
                @click=${this.newPerspectiveClicked}
                label="new perspective"
              ></mwc-button>
            `}
      </div>
    `;
  }

  renderPermissions() {
    return html`
      <div class="perspectives-permissions">
        <permissions-for-entity hash=${this.perspectiveId}></permissions-for-entity>
      </div>
    `;
  }

  renderTabContent() {
    if (this.activeTabIndex === 0) return this.renderOtherPerspectives();
    else if (this.activeTabIndex === 1) return this.renderInfo();
    else return this.renderPermissions();
  }

  render() {
    return html`
      <div class="container">
        <div class="button" @click=${this.showClicked}>
          <div
            class="evee-stripe"
            style=${styleMap({
              backgroundColor: (this.eveeColor ? this.eveeColor : DEFAULT_COLOR) + '80'
            })}
          ></div>
        </div>

        ${this.show
          ? html`
              <mwc-card class="info-box">
                ${this.perspectiveData
                  ? html`
                      <div class="column">
                        <div
                          class="color-bar"
                          style=${styleMap({
                            backgroundColor: this.eveeColor
                          })}
                        ></div>

                        <div
                          class="perspective-title"
                          style=${styleMap({
                            color: this.eveeColor
                          })}
                        >
                          <h2>${this.perspectiveTitle()}</h2>
                        </div>

                        <mwc-tab-bar
                          @MDCTabBar:activated=${e => (this.activeTabIndex = e.detail.index)}
                        >
                          <mwc-tab .label=${this.t('evees:other-perspectives')} hasImageIcon>
                            <mwc-icon>list_alt</mwc-icon>
                          </mwc-tab>
                          <mwc-tab .label=${this.t('evees:information')} hasImageIcon>
                            <mwc-icon>info</mwc-icon>
                          </mwc-tab>
                        </mwc-tab-bar>

                        <div class="tab-content-container">
                          <div class="tab-content">
                            ${this.renderTabContent()}
                          </div>
                        </div>

                        <div class="close">
                          <mwc-icon-button
                            icon="close"
                            @click=${this.showClicked}
                          ></mwc-icon-button>
                        </div>
                      </div>
                    `
                  : ''}
              </mwc-card>
            `
          : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      .container {
        position: relative;
        height: 100%;
      }
      .button {
        cursor: pointer;
        padding-top: 5px;
        padding-left: 10px;
        padding-right: 10px;
        height: 100%;
        border-radius: 3px;
        user-select: none;
        transition: background-color 100ms linear;
      }
      .button:hover {
        background-color: #eef1f1;
      }
      .evee-stripe {
        width: 10px;
        height: calc(100% - 10px);
        border-radius: 3px;
      }
      .info-box {
        width: auto;
        z-index: 20;
        position: absolute;
        left: 30px;
        top: 0;
        width: 80vw;
        max-width: 700px;
      }
      .tab-content-container {
        min-height: 400px;
        display: flex;
        flex-direction: column;
      }
      .tab-content {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      .color-bar {
        height: 1vw;
        width: 100%;
        margin-bottom: 1vw;
        border-top-right-radius: 4px;
        border-top-left-radius: 4px;
      }
      .perspective-title {
        font-weight: bold;
        padding: 0.5vw 0 1.5vw 1.5vw;
      }
      .button-row {
        padding-bottom: 16px;
        text-align: center;
      }
      .perspectives-list {
        flex-grow: 1;
      }
      .close {
        position: absolute;
        top: 20px;
        right: 20px;
      }

      .perspective-details {
        padding: 5px;
      }

      .summary {
        margin: 0 auto;
        padding: 32px 32px;
        max-width: 300px;
        text-align: center;
      }

      .card-container {
        flex-grow: 1;
        display: flex;
        padding: 10px;
      }

      .card {
        flex: 1;
        width: 100%;
        height: 100%;
        border: solid 1px #cccccc;
        border-radius: 3px;
      }

      .technical-details {
        max-width: 640px;
        margin: 0 auto;
      }

      .tech-card {
        width: 100%;
        padding: 16px 32px;
        text-align: center;
      }

      .tech-table .prop-name {
        text-align: right;
        font-weight: bold;
      }

      .tech-table .prop-value {
        font-family: Lucida Console, Monaco, monospace;
        font-size: 12px;
        text-align: left;
      }
    `;
  }
}
