import { html, css, property } from 'lit-element';
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { EveesInfoBase } from './evee-info-base';
import { DEFAULT_COLOR } from './evees-perspective';

export class EveesInfoPopper extends EveesInfoBase {

  @property({ attribute: false })
  show: Boolean = false;

  firstUpdated() {
    this.show = true;
    this.load();
  }

  showClicked() {
    this.show = !this.show;
    if (this.show) this.load();
  }

  async newPerspectiveClicked () {
    super.newPerspectiveClicked();
    this.show = false;
  }

  perspectiveTitle() {
    if (this.perspectiveId === this.firstPerspectiveId) {
      return 'Current Perspective';
    } else {
      return `Another Perspective`;
    }
  }

  renderInfo() {
    return html`
      <div class="perspective-details">
        <span><strong>Id:</strong> ${this.perspectiveData.id}</span>
        <span><strong>Name:</strong> ${this.perspectiveData.details.name}</span>
        <span><strong>Context:</strong> ${this.perspectiveData.details.context}</span>
        <span><strong>Origin:</strong> ${this.perspectiveData.perspective.origin}</span>
        <span><strong>Head:</strong> ${this.perspectiveData.details.headId}</span>
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
      <div class="row">
        ${this.loading
          ? this.renderLoading()
          : html`
              <mwc-button
                outlined
                icon="call_split"
                @click=${this.newPerspectiveClicked}
                label="Create new perspective"
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
        <div
          class="button"
          style=${styleMap({
            backgroundColor: this.eveeColor ? this.eveeColor : DEFAULT_COLOR
          })}
          @click=${this.showClicked}
        ></div>

        ${this.show
          ? html`
              <mwc-card class="info-box">
                ${this.perspectiveData
                  ? html`
                      <div class="column">
                        <div
                          class="perspective-title"
                          style=${styleMap({
                            backgroundColor: this.eveeColor,
                            color: this.perspectiveTextColor()
                          })}
                        >
                          ${this.perspectiveTitle()}
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
                          <mwc-tab .label=${this.t('evees:permissions')} hasImageIcon>
                            <mwc-icon>group</mwc-icon>
                          </mwc-tab>
                        </mwc-tab-bar>

                        <div class="tab-content-container">
                          <div class="tab-content">
                            ${this.renderTabContent()}
                          </div>
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
        width: 15px;
      }
      .button {
        height: calc(100% - 10px);
        margin-top: 5px;
        margin-left: 5px;
        width: 10px;
        border-radius: 3px;
        cursor: pointer;
      }
      .button:hover {
        background-color: #cccccc;
      }
      .popout {
        z-index: 20;
        position: absolute;
        left: 20px;
        top: 0;
      }
      .info-box {
        width: auto;
      }
      .perspective-details {
        flex-grow: 1;
        flex-direction: column;
        display: flex;
      }
      .perspective-details > span {
        padding-bottom: 4px;
      }
      .row {
        display: flex;
        flex-direction: row;
      }
      .column {
        display: flex;
        flex-direction: column;
      }
      .perspective-title {
        padding: 16px;
        font-weight: bold;
        border-top-right-radius: 4px;
        border-top-left-radius: 4px;
      }
      .perspectives-list {
        border-bottom: solid 1px #d9d7d0;
        margin-bottom: 16px;
        flex-grow: 1;
      }
      .perspectives-permissions {
        flex-grow: 1;
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
    `;
  }
}
