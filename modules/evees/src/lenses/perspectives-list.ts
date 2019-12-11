import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { EveesTypes, PerspectiveDetails, Perspective } from '../types';
import { Secured, selectCanWrite, PermissionsStatus } from '@uprtcl/common';
import { PatternTypes, PatternRecognizer } from '@uprtcl/cortex';
import { GraphQlTypes } from '@uprtcl/common';
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

  async firstUpdated() {
    this.recognizer = this.request(PatternTypes.Recognizer);
    this.updatePerspectivesData();
  }

  updatePerspectivesData = async () => {
    // const evees: any = this.request(EveesTypes.Evees);
    // const details: PerspectiveDetails = await evees.getPerspectiveDetails(this.rootPerspectiveId);
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);
    console.log(this.rootPerspectiveId)
    const result = await client.query({
      query: gql`{
        getEntity(id: "${this.rootPerspectiveId}") {
          entity {
            ... on Perspective {
              context {
                context
                perspectives {
                  id
                }
              } 
            } 
          } 
        }
      }`
    });

    console.log(result);

    // if (details === undefined) {
    //   this.perspectivesData = [];
    //   return;
    // }

    // const otherPerspectives: Array<Secured<Perspective>> = await evees.getContextPerspectives(
    //   details.context
    // );

    // const perspectivesPromises = otherPerspectives.map(
    //   async (perspective: Secured<Perspective>): Promise<PerspectiveData> => {
    //     const details = await evees.getPerspectiveDetails(perspective.id);
    //     const permissions: PermissionsStatus = {
    //       canWrite: false
    //     };
    //     const perspectiveData: PerspectiveData = {
    //       id: perspective.id,
    //       perspective: perspective.object.payload,
    //       details: details,
    //       permissions: permissions
    //     };
    //     return perspectiveData;
    //   }
    // );

    // this.perspectivesData = await Promise.all(perspectivesPromises);
    // this.stateChanged(this.store.getState());
    console.log(`[PERSPECTIVE-LIST] updatePerspectivesData`, {
      perspectivesData: JSON.stringify(this.perspectivesData)
    });
  };

  stateChanged(state) {
    /** update canWrite */
    this.perspectivesData.forEach(perspectiveData => {
      const canWrite = selectCanWrite(this.recognizer)(perspectiveData.id)(state);
      perspectiveData.permissions = {
        canWrite
      };
    });
    this.perspectivesData = [...this.perspectivesData];
    console.log(`[PERSPECTIVE-LIST] stateChanged`, { perspectivesData: this.perspectivesData });
  }

  openPerspective = id => {
    //crear evento para manejar id de perspectiva, en vez de en el url
    window.history.pushState('', '', `/?id=${id}`);
  };

  renderPerspective(perspectiveData: PerspectiveData) {
    const style = perspectiveData.id == this.rootPerspectiveId ? 'font-weight: bold;' : '';
    return html`
      <li style=${style} @click=${() => this.openPerspective(perspectiveData.id)}>
        ${perspectiveData.details.name} - Creator: ${perspectiveData.perspective.creatorId} -
        ${perspectiveData.permissions.canWrite ? `merge` : ``};
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
