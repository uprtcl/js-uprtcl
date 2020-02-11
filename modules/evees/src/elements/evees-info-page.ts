import { html, css } from 'lit-element';
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { EveesInfoBase } from './evee-info-base';

export class EveesInfoPage extends EveesInfoBase {

  firstUpdated() {
    this.load();
  }

  perspectiveTitle() {
    if (this.perspectiveId === this.firstPerspectiveId) {
      return 'Accepted Perspective';
    } else {
      return `Another Perspective`;
    }
  }

  renderOtherPerspectives() {
    return html`
      <evees-perspectives-list
        perspective-id=${this.perspectiveId}
        first-perspective-id=${this.firstPerspectiveId}
        @perspective-selected=${this.otherPerspectiveClicked}
        @merge-perspective=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, false)}
        @create-proposal=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, true)}
        @authorize-proposal=${this.authorizeProposal}
        @execute-proposal=${this.executeProposal}
      ></evees-perspectives-list>
    `;
  }

  renderPermissions() {
    return html`
      <div class="perspectives-permissions">
        <permissions-for-entity hash=${this.perspectiveId}></permissions-for-entity>
      </div>
    `;
  }

  render() {
    return html`
      ${this.perspectiveData ?
        html`
        <div class="container">
          <div class="column">
            <div class="section">
              <div class="section-header" style=${styleMap({
                color: this.eveeColor
              })}>
                ${this.perspectiveTitle()}
              </div>
              <div class="section-content">
                <div class="description info-text">
                  <div style="margin-bottom: 16px">
                    ${!this.perspectiveData.canWrite ? html`
                      <p>
                        <span>You can't edit this perspective, but you can create a new one!</span>
                      </p>` : html`
                      <p>
                        <span>You can create and edit new pages! <br><br>When you are done, checkout the "Accepted Perspective" and make a "Propose Merge".</span>
                      </p>
                      `}
                  </div>
                  ${!this.perspectiveData.canWrite ? html`
                    <mwc-button
                      outlined
                      icon="call_split"
                      @click=${this.newPerspectiveClicked}
                      label="new perspective"
                    ></mwc-button>` : ''}
                </div>
                <div class="other-perspectives">
                  ${this.renderOtherPerspectives()}
                </div>
                ${this.perspectiveData.canWrite ? html`
                  <mwc-button
                    outlined
                    icon="call_split"
                    @click=${this.newPerspectiveClicked}
                    label="new perspective"
                  ></mwc-button>` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                Access Control
              </div>
              <div class="section-content info-text">
                ${this.renderPermissions()}
              </div>

              <!-- <div class="technical-details">
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
              </div> -->

          </div>
        </div>` : ''}
    `;
  }

  static get styles() {
    return css`
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
        overflow: hidden;
        background-color: white;
      }
      .section-header {
        font-weight: bold;
        padding: 1.5vw 0px 0.8vw 0px; 
        font-size: 1.6em;
        border-style: solid 2px;
      }
      .section-content {
        padding: 2.2vw 0px 2.2vw 0px;
      }
      .description {
        padding: 0px 2.5vw;
      }
      .info-text {
        color: #4e585c;
      }
      .other-perspectives {
        border-top: solid 1px #cccccc;
        margin-top: 1.8vw;
        min-height: 200px;
        display: flex;
        flex-direction: column;
      }
    `;
  }
}
