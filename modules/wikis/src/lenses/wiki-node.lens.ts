import { LitElement, property, html, css } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { LensElement } from '@uprtcl/lenses';
import { EveesTypes, Evees, EveesProvider, PerspectiveDetails } from '@uprtcl/evees';
import { DocumentsTypes, DocumentsProvider } from '@uprtcl/documents';
import { WikiNode } from '../types';

export class WikiNodeLens extends moduleConnect(LitElement) implements LensElement<WikiNode> {
  @property({ type: Object })
  data!: WikiNode;

  @property({ type: String })
  rootHash: String = window.location.href.split('id=')[1];

  @property({ type: String })
  selectedPageHash!: String;

  @property({ type: Array })
  wikiPerspectives: Array<any> = [];

  createPage = async () => {
    const perspectivePattern: any = this.request(EveesTypes.PerspectivePattern);
    const pagePattern: any = this.request(DocumentsTypes.TextNodePattern);

    const eveesProvider: any = this.requestAll(EveesTypes.EveesRemote).find((provider: any) => {
      const regexp = new RegExp('^http');
      return regexp.test(provider.service.uprtclProviderLocator);
    });

    const pagesProvider: any = this.requestAll(DocumentsTypes.DocumentsRemote).find(
      (provider: any) => {
        const regexp = new RegExp('^http');
        return regexp.test(provider.service.uprtclProviderLocator);
      }
    );

    const pageHash = await pagePattern.create({}, pagesProvider.service.uprtclProviderLocator);

    const perspective = await perspectivePattern.create(
      { dataId: pageHash.id },
      eveesProvider.service.uprtclProviderLocator
    );

    this.data.pages.push(perspective.id);
    this.updateContent(this.data.pages);
  };

  listPerspectives = async idPerspective => {
    const evees: Evees = this.request(EveesTypes.Evees);
    const { context }: PerspectiveDetails = await evees.getPerspectiveDetails(idPerspective);
    if (context === undefined) {
      this.wikiPerspectives = [] 
    } else {
      const perspectivesList = await evees.getContextPerspectives(context);
      console.log(context)
      this.wikiPerspectives = perspectivesList;
    }
  };

  updateContent(pages: Array<string>) {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: { newContent: { ...this.data, pages } },
        bubbles: true,
        composed: true
      })
    );
  }

  setPage(pageHash) {
    this.selectedPageHash = pageHash;
  }

  openWikiPerspective = id => {
    // window.location.href.split('id=')[1] = id
    window.history.pushState('', '', `/?id=${id}`);
  };

  render() {
    return html`
      <slot name="plugins"> </slot>
      <div class="row">
        <div class="column left" style="background-color:#aaa;">
          <h2>${this.data.title}</h2>
          <ul>
            ${this.data.pages.map(page => {
              return html`
                <li @click=${() => this.setPage(page)}>${page}</li>
              `;
            })}
          </ul>

          <mwc-button @click=${() => this.createPage()}>
            <mwc-icon>note_add</mwc-icon>
            new page
          </mwc-button>

          <h4>Perspectives</h4>
          <button @click=${() => this.listPerspectives(this.rootHash)}>
            See all perspectives
          </button>
          ${this.wikiPerspectives.length > 0
            ? html`
                <ul>
                  ${this.wikiPerspectives.map(perspective => {
                    return html`
                      <li @click=${() => this.openWikiPerspective(perspective.id)}>
                        ${perspective.id}
                      </li>
                    `;
                  })}
                </ul>
              `
            : ''}
        </div>
        <div class="column right" style="background-color:#bbb;">
          <p>
            ${this.selectedPageHash
              ? html`
                  <cortex-entity .hash=${this.selectedPageHash}></cortex-entity>
                `
              : html`
                  Loading...
                `}
          </p>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      * {
        box-sizing: border-box;
      }

      li {
        word-wrap: break-word;
        margin-bottom: 9px;
        cursor: pointer;
      }

      .column {
        float: left;
        padding: 10px;
        height: 100vh; /* Should be removed. Only for demonstration */
      }

      .left {
        width: 25%;
      }

      .right {
        width: 75%;
      }

      .row:after {
        content: '';
        display: table;
        clear: both;
      }
    `;
  }
}
