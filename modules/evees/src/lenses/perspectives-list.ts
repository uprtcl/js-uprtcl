import { LitElement, property, html, css } from 'lit-element';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { EveesTypes, PerspectiveDetails, Perspective } from '../types';
import { Secured, selectCanWrite } from '@uprtcl/common';
import { PatternTypes } from '@uprtcl/cortex';

export class PerspectivesList extends reduxConnect(LitElement) {
  @property({ type: String })
  rootPerspectiveId!: string;

  @property({ attribute: false })
  perspectives: Array<Object> = [];

  firstUpdated() {
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
      const perspectiveIDs: Array<string> = [];

      const perspectivesPromises = perspectivesList.map(
        (perspective: Secured<Perspective>): Array<Promise<PerspectiveDetails>> => {
          perspectiveIDs.push(perspective.id);
          return evees.getPerspectiveDetails(perspective.id);
        }
      );

      const resolved = await Promise.all(perspectivesPromises);
      this.perspectives = resolved.map((perspective: any, index: number) => {
        return {
          id: perspectiveIDs[index],
          name: perspective.name
        };
      });
    }
  };

  // stateChanged(state) {
  //   this.perspectives = this.perspectives.map(perspective => {
  //     let updatedPerspective: any = this.perspectives.find(p => p['id'] == perspective['id']);
  //     console.log(updatedPerspective)
  //     selectCanWrite(this.request(PatternTypes.Recognizer))(updatedPerspective['id'])(state);
  //     return updatedPerspective;
  //   });
  // }

  openWikiPerspective = id => {
    //crear evento para manejar id de perspectiva, en vez de en el url
    window.history.pushState('', '', `/?id=${id}`);
  };

  renderPerspective(perspective) {
    return html`
      <li @click=${() => this.openWikiPerspective(perspective.id)}>
        ${perspective.name}
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
