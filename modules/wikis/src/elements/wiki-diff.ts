import { Evees, Logger, servicesConnect } from '@uprtcl/evees';
import { LitElement, property, html, css, internalProperty } from 'lit-element';

import { Wiki } from '../types';

const LOGINFO = false;

export class WikiDiff extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ type: Boolean })
  summary = false;

  @internalProperty()
  newData!: Wiki;

  @internalProperty()
  oldData!: Wiki;

  @internalProperty()
  loading = true;

  localEvees!: Evees;

  oldTitle = '';

  async firstUpdated() {
    this.logger.log('firstUpdated()', {
      newData: this.newData,
      oldData: this.oldData,
    });

    this.loadChanges();
  }

  async loadChanges() {
    this.loading = true;
    this.oldTitle = this.oldData ? this.oldData.title : '';
    this.loading = false;
  }

  async getTitle(uref: string): Promise<string> {
    const data = await this.localEvees.getPerspectiveData(uref);
    return this.localEvees.behaviorFirst(data.object, 'title');
  }

  renderTitleChange(title: string, classes: string[]) {
    return html`
      <div class=${['page-row'].concat(classes).join(' ')}>
        <h1>${title}</h1>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    const titleChanged = this.newData.title !== this.oldTitle;

    return html`
      ${titleChanged
        ? html`
            <evees-diff-row type="edit"
              ><div class="page-list-title">New Title</div>
              ${this.renderTitleChange(this.newData.title, ['green-background'])}
              ${this.renderTitleChange(this.oldTitle, ['red-background'])}
            </evees-diff-row>
          `
        : ''}
    `;
  }

  static get styles() {
    return css`
      :host {
        text-align: left;
      }
      .page-list-title {
        font-weight: bold;
        margin-bottom: 9px;
        color: gray;
      }
      .page-row {
        padding: 2vw;
        border-radius: 3px;
        margin-bottom: 16px;
      }
      .green-background {
        background-color: #abdaab;
      }
      .red-background {
        background-color: #dab6ab;
      }
    `;
  }
}
