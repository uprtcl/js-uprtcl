import { LitElement, property, html, css } from 'lit-element';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { EveesTypes, PerspectiveDetails, Perspective } from '../types';
import { Secured, selectCanWrite, PermissionsStatus } from '@uprtcl/common';
import { PatternTypes, PatternRecognizer } from '@uprtcl/cortex';

interface PerspectiveData {
  id: string;
  perspective: Perspective;
  details: PerspectiveDetails;
  permissions: PermissionsStatus;
}

export class PerspectivesList extends reduxConnect(LitElement) {
  @property({ type: String })
  rootPerspectiveId!: string;

  @property({ attribute: false })
  perspectivesData: Array<PerspectiveData> = [];

  private recognizer!: PatternRecognizer;

  firstUpdated() {
    this.recognizer = this.request(PatternTypes.Recognizer);
    this.updatePerspectivesData();
  }

  updatePerspectivesData = async () => {
    const evees: any = this.request(EveesTypes.Evees);
    const details: PerspectiveDetails = await evees.getPerspectiveDetails(this.rootPerspectiveId);

    if (details === undefined) {
      this.perspectivesData = [];
      return;
    }

    const otherPerspectives: Array<Secured<Perspective>> = await evees.getContextPerspectives(
      details.context
    );

    const perspectivesPromises = otherPerspectives.map(
      async (perspective: Secured<Perspective>): Promise<PerspectiveData> => {
        const details = await evees.getPerspectiveDetails(perspective.id);
        const permissions: PermissionsStatus = {
          canWrite: false
        };
        const perspectiveData: PerspectiveData = {
          id: perspective.id,
          perspective: perspective.object.payload,
          details: details,
          permissions: permissions
        };
        return perspectiveData;
      }
    );

    this.perspectivesData = await Promise.all(perspectivesPromises);
    console.log(`[PERSPECTIVE-LIST] updatePerspectivesData`, {perspectivesData: JSON.stringify(this.perspectivesData)});
  };

  stateChanged(state) {
    /** update canWrite 
     * TODO: reactivity will not work, either make a new object of perspectivesData, or 
     * create a custom changed() function for the attribute that chceks the canWrite.
    */
    this.perspectivesData.forEach(perspectiveData => {
      const canWrite = selectCanWrite(this.recognizer)(perspectiveData.id)(state);
      perspectiveData.permissions = {
        canWrite
      }
    });
    console.log(`[PERSPECTIVE-LIST] stateChanged`, {perspectivesData: this.perspectivesData});
  }

  openPerspective = id => {
    //crear evento para manejar id de perspectiva, en vez de en el url
    window.history.pushState('', '', `/?id=${id}`);
  };

  renderPerspective(perspectiveData: PerspectiveData) {
    const style = perspectiveData.id == this.rootPerspectiveId ? 'font-weight: bold;' : '';
    return html`
      <li style=${style} @click=${() => this.openPerspective(perspectiveData.id)}>
        ${perspectiveData.details.name} 
        - Creator: ${perspectiveData.perspective.creatorId} 
        - ${perspectiveData.permissions.canWrite ? `merge` : ``};
      </li>
    `;
  }

  render() {
    return html`
      <h4>Perspectives</h4>
      ${this.perspectivesData.length > 0
        ? html`
            <ul>
              ${this.perspectivesData.map(perspectivesData => {
                return this.renderPerspective(perspectivesData);
              })}
            </ul>
          `
        : ''}
    `;
  }
}
