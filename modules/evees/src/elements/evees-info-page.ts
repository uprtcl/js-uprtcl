import { html, css, property } from 'lit-element';
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { EveesInfoBase } from './evee-info-base';
import { prettyAddress } from './support';
import { UPDATE_HEAD } from 'src/graphql/queries';
import { ApolloClient } from 'apollo-boost';

const NAME_FIELD = 'NAME_FIELD';

export class EveesInfoPage extends EveesInfoBase {

  @property({type: Boolean, attribute: false})
  showEditName: boolean = false;

  firstUpdated() {
    super.firstUpdated();
  }

  perspectiveTitle() {
    if (!this.perspectiveData) return this.perspectiveId;

    if (this.perspectiveId === this.firstPerspectiveId) {
      return 'Official Version';
    } 

    const hasName = this.perspectiveData.details.name !== undefined && this.perspectiveData.details.name !== '';
    const name = html`${this.perspectiveData.details.name}`;
    const defaultName = html`by ${prettyAddress(this.perspectiveData.perspective.creatorId)}`;

    const rename = html`<mwc-icon-button class="edit-btn" icon="edit" @click=${this.editNameClicked}></mwc-icon-button>`;
    
    return html`Draft ${hasName ? name : defaultName} ${rename}`;
  }

  async editNameClicked() {
    this.showEditName = true;
  }

  async saveName() {
    if (!this.shadowRoot) return;
    const client = this.client as ApolloClient<any>
    const input = this.shadowRoot.getElementById('DRAFT_NAME') as any;
    const newName = input.value;

    this.showEditName = false;

    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.perspectiveId,
        name: newName
      }
    });

    this.load();    
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
          ref=${this.perspectiveId}>
        </permissions-for-entity>
      </div>
    `;
  }

  renderEditNameForm() {
    return html`
      <div class="row">
        <mwc-textfield
          outlined
          id="DRAFT_NAME"
          value=${this.perspectiveData.details.name as string} 
          label="Draft Name">
        </mwc-textfield>
      </div>
      <div class="row">
        <mwc-button
          outlined
          icon="clear"
          @click=${() => this.showEditName = false}
          label="Cancel"
        ></mwc-button>
        <mwc-button
          outlined
          icon="done"
          @click=${this.saveName}
          label="Save"
        ></mwc-button>
      </div>`;
  }

  render() {
    if (this.perspectiveData === undefined) return html``;
    return html`
      <div class="container">
        <div class="column">
          <div class="section">
            <div class="section-header perspective-header" style=${styleMap({'border-color': this.eveeColor})}>
              ${this.perspectiveTitle()}
            </div>
            ${this.showEditName ? html`
            <div>
              ${this.renderEditNameForm()}
            </div>` : ''}
            <div class="section-content">
              <div class="info-text">
                ${!this.perspectiveData.canWrite ? 
                  html`
                    <p style="margin-bottom: 16px">
                      <span>You can't directly edit this version, but you can create a new draft proposal!</span>
                    </p>
                  ` : html`
                    <p style="margin-bottom: 16px">
                      <span>You can edit this draft<br><br>${this.publicRead ? 
                        html`Propose an update to the official version!` : 
                        html`When you are done, make it public (below) and then propose an update to the official version`}</span>
                    </p>`
                }
              </div>
              <div class="action-button">    
                ${this.perspectiveData.canWrite ? 
                  html`
                    <mwc-button
                      .disabled=${!this.publicRead}
                      class="bottom-button"
                      outlined
                      icon="call_merge"
                      @click=${this.proposeMergeClicked}
                      label="Propose Update"
                    ></mwc-button>` 
                  : html`
                    <mwc-button
                      outlined
                      class="bottom-button"
                      icon="call_split"
                      @click=${this.newPerspectiveClicked}
                      label="new draft"
                    ></mwc-button>`
                }
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

          <div class="section">
            <div class="section-header">
              Evee Info
            </div>
            <div class="section-content info-text">
              ${this.renderInfo()}
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
    return super.styles.concat([css`

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
        position: relative;
      }
      .section-header {
        font-weight: bold;
        padding: 1.5vw 0px 0.8vw 0px; 
        font-size: 1.6em;
        border-style: solid 2px;
      }
      .edit-btn {
        position: absolute;
        top: 20px;
        right: 20px;
      }
      .row mwc-textfield{
        margin: 30px 0px;
      }
      .perspective-header {
        border-top-style: solid;
        border-top-width: 5px;
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
        margin: 32px 0px;
      }
      .other-perspectives {
        border-top: solid 1px #cccccc;
        margin-top: 1.8vw;
        min-height: 200px;
        display: flex;
        flex-direction: column;
      }
    `]);
  }
}
