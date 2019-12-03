import { LitElement, property, html, css } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesTypes, PerspectiveDetails, Perspective } from '../types';
import { Secured } from '@uprtcl/common';

export class PerspectivesList extends moduleConnect(LitElement) {
  @property({ type: Array })
  wikiPerspectives: Array<any> = [];

  @property({ type: String })
  rootHash: String = window.location.href.split('id=')[1];

  listPerspectives = async idPerspective => {
    const evees: any = this.request(EveesTypes.Evees);
    const { context }: PerspectiveDetails = await evees.getPerspectiveDetails(idPerspective);
    if (context === undefined) {
      this.wikiPerspectives = [];
    } else {
      const perspectivesList: Array<Secured<Perspective>> = await evees.getContextPerspectives(
        context
      );
      const perspectiveIDs: Array<string> = [];

      const perspectivesPromises = perspectivesList.map(
        (perspective: Secured<Perspective>): Array<Promise<PerspectiveDetails>> => {
          perspectiveIDs.push(perspective.id);
          return evees.getPerspectiveDetails(perspective.id);
        }
      );
      Promise.all(perspectivesPromises).then(resolved => {
        this.wikiPerspectives = resolved.map((perspective: any, index: number) => {
          return {
            name: perspective.name,
            id: perspectiveIDs[index]
          };
        });
      });
    }
  };

  openWikiPerspective = id => {
    window.history.pushState('', '', `/?id=${id}`);
  };

  render() {
    return html`
      <div slot="plugins">
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
                      ${perspective.name}
                    </li>
                  `;
                })}
              </ul>
            `
          : ''}
      </div>
    `;
  }
}
