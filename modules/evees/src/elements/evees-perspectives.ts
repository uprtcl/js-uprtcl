import { html, css, property, query } from 'lit-element';
import { EveesInfoBase } from './evee-info-base';
import { Logger } from '@uprtcl/micro-orchestrator';
import { EveesPerspectivesList } from './evees-perspectives-list';

export class EveesPerspectives extends EveesInfoBase {
  logger = new Logger('EVEES-PERSPECTIVES');

  @property({ type: Array })
  hidePerspectives!: string[];

  @query('#evees-perspectives-list')
  eveesPerspectivesList!: EveesPerspectivesList;

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

  async load() {
    super.load();
    this.eveesPerspectivesList.load();
  }

  render() {
    if (this.perspectiveData === undefined)
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;

    return html`
        <div class="list-container">
          ${
            !this.loading
              ? html`
                  <evees-perspectives-list
                    id="evees-perspectives-list"
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
          ${
            this.isLoggedOnDefault
              ? html`
                  <uprtcl-button-loading
                    skinny
                    icon="call_split"
                    @click=${this.newPerspectiveClicked}
                    loading=${this.creatingNewPerspective ? 'true' : 'false'}
                  >
                    new draft
                  </uprtcl-button-loading>
                `
              : ''
          }
        </div>
      </div>
    `;
  }

  static get styles() {
    return super.styles.concat([
      css`
        uprtcl-button-loading {
          margin: 0 auto;
        }
      `
    ]);
  }
}
