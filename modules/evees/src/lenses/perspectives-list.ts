import { LitElement, property, html, css } from 'lit-element';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { EveesTypes, PerspectiveDetails, Perspective } from '../types';
import { Secured, selectCanWrite } from '@uprtcl/common';
import { PatternTypes } from '@uprtcl/cortex';

export class PerspectivesList extends reduxConnect(LitElement) {
  @property({ type: String })
  rootPerspectiveId!: string;

  @property({})
  perspectivesInfo: Object = {};

  firstUpdated() {
    this.listPerspectives(this.rootPerspectiveId);
  }

  listPerspectives = async idPerspective => {
    const evees: any = this.request(EveesTypes.Evees);
    const details: PerspectiveDetails = await evees.getPerspectiveDetails(idPerspective);
    console.log(details);
    console.log('test');
    if (details === undefined) {
      // this.perspectives = [];
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

      Promise.all(perspectivesPromises).then(resolved => {
        resolved.map((perspective: any, index: number) => {
          let perspectiveId = perspectiveIDs[index];
          this.perspectivesInfo[perspectiveId] = {
            name: perspective.name
          };
        });
      });
      console.log(this.perspectivesInfo);
    }
  };

  stateChanged(state) {
    Object.keys(this.perspectivesInfo).map(perspectiveId => {
      this.perspectivesInfo[perspectiveId]['canMerge'] = selectCanWrite(
        this.request(PatternTypes.Recognizer)
      )(perspectiveId)(state);
    });
  }

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
      ${Object.keys(this.perspectivesInfo).length > 0
        ? html`
            <ul>
              ${Object.keys(this.perspectivesInfo).map(perspectiveId => {
                this.renderPerspective(this.perspectivesInfo[perspectiveId]);
              })}
            </ul>
          `
        : ''}
    `;
  }
}
