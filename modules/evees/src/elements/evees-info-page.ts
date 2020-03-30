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
    super.firstUpdated();
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
        force-update=${this.forceUpdate}
        perspective-id=${this.perspectiveId}
        first-perspective-id=${this.firstPerspectiveId}
        @perspective-selected=${(e) => this.otherPerspectiveClicked(e.detail.id)}
        @merge-perspective=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, this.perspectiveId, false)}
        @create-proposal=${e => this.otherPerspectiveMerge(e.detail.perspectiveId, this.perspectiveId, true)}
        @authorize-proposal=${this.authorizeProposal}
        @execute-proposal=${this.executeProposal}
      ></evees-perspectives-list>
    `;
  }

  renderPermissions() {
    return html`
      <div class="perspectives-permissions">
        <permissions-for-entity 
          hash=${this.perspectiveId}>
        </permissions-for-entity>
      </div>
    `;
  }

  render() {
    if (this.perspectiveData === undefined) return html``;
    return html`
      <div class="container">
        <div class="column">
          <div class="section">
            <div class="section-header" style=${styleMap({color: this.eveeColor})}>
              ${this.perspectiveTitle()}
            </div>
            <div class="section-content">
              <div class="description info-text">
                <div>
                  ${!this.perspectiveData.canWrite ? html`
                      <p style="margin-bottom: 16px">
                        <span>You can't edit this perspective, but you can create a new one!</span>
                      </p>
                      <mwc-button
                        outlined
                        icon="call_split"
                        @click=${this.newPerspectiveClicked}
                        label="new perspective"
                      ></mwc-button>
                    ` : html`
                      <p style="margin-bottom: 16px">
                        <span>You can edit this perspective<br><br>${this.publicRead ? 
                          html`Propose a merge to the accepted perspective!` : 
                          html`When you are done, make it public (below) and then propose a merge`}</span>
                      </p>
                      <mwc-button
                        .disabled=${!this.publicRead}
                        class="bottom-button"
                        outlined
                        icon="call_merge"
                        @click=${this.proposeMergeClicked}
                        label="Propose Merge"
                      ></mwc-button>
                    ` 
                  }
                </div>
              </div>
              <div class="other-perspectives">
                ${this.renderOtherPerspectives()}
              </div>
              ${this.perspectiveData.canWrite ? html`
                <mwc-button
                  class="bottom-button"
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
          </div>

          ${this.perspectiveData.canWrite ? html`
            <div class="section">
              <div class="section-header">
                Delete
              </div>
              <div class="section-content info-text">
                <mwc-button
                  outlined
                  class="bottom-button"
                  icon="delete_forever"
                  @click=${() => this.delete()}
                  label="Delete"
                ></mwc-button>
              </div>
            </div>` : ''}

        </div>
      </div>`;
  }

  static get styles() {
    return css`

      mwc-button {
        width: 220px;
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
      .bottom-button {
        margin: 32px 0px;
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
