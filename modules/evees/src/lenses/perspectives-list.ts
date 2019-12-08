import { LitElement, property, html, css } from 'lit-element';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { EveesTypes, PerspectiveDetails, Perspective } from '../types';
import { Secured, selectCanWrite } from '@uprtcl/common';
import { PatternTypes, PatternRecognizer } from '@uprtcl/cortex';


interface PerspectiveObject {
  id: string;
  creatorId: string;
  name?: string;
  canMerge?: boolean;
}

export class PerspectivesList extends reduxConnect(LitElement) {
  @property({ type: String })
  rootPerspectiveId!: string;

  @property({ attribute: false })
  perspectives: Array<PerspectiveObject> = [];

  private recognizer!:PatternRecognizer;

  firstUpdated() {
    this.recognizer = this.request(PatternTypes.Recognizer)
    this.listPerspectives(this.rootPerspectiveId);
  }

  listPerspectives = async idPerspective => {
    const evees: any = this.request(EveesTypes.Evees);
    const details: PerspectiveDetails = await evees.getPerspectiveDetails(idPerspective);
    if (details === undefined) {
      this.perspectives = [];
    } else {
      const perspectivesList: Array<Secured<Perspective>> = await evees.getContextPerspectives(
        details.context
      );

      const perspectiveIDs: Array<PerspectiveObject> = [];
      const perspectivesPromises = perspectivesList.map(
        (perspective: Secured<Perspective>): Array<Promise<PerspectiveDetails>> => {
          const { creatorId } =  perspective.object.payload
          perspectiveIDs.push({ id: perspective.id, creatorId });
          return evees.getPerspectiveDetails(perspective.id);
        }
      );

      const resolved = await Promise.all(perspectivesPromises);
      this.perspectives = resolved.map((perspective: any, index: number) => {
        return {
          id: perspectiveIDs[index].id,
          creatorId: perspectiveIDs[index].creatorId,
          name: perspective.name
        };
      });
    }
  };
  
  stateChanged(state) {
    this.perspectives = this.perspectives.map(perspective => {
      let updatedPerspective: any = this.perspectives.find(p => p['id'] == perspective['id']);
      updatedPerspective['canMerge'] = selectCanWrite(this.recognizer)(updatedPerspective['id'])(state);
      return updatedPerspective;
    });
  }

  openPerspective = id => {
    //crear evento para manejar id de perspectiva, en vez de en el url
    window.history.pushState('', '', `/?id=${id}`);
  };

  renderPerspective(perspective) {
    const style = perspective.id == this.rootPerspectiveId ? 'font-weight: bold;' : ''
    return html`
      <li style=${style} @click=${() => this.openPerspective(perspective.id)} >
        ${perspective.name} - Owner: ${perspective.creatorId} - ${perspective['canMerge']}
      </li>
    `;
  }

  render() {
    return html`
      <h4>Perspectives</h4>
      ${this.perspectives.length > 0
        ? html`
            <ul>
              ${this.perspectives.map(perspective => {
                return this.renderPerspective(perspective);
              })}
            </ul>
          `
        : ''}
    `;
  }
}
