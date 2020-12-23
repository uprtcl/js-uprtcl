import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import {  
  CortexModule,
  HasTitle,
  PatternRecognizer
} from '@uprtcl/cortex';

import { ApolloClientModule } from '@uprtcl/graphql';
import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';

import { EveesBindings } from './../bindings';
import { EveesRemote } from './../services/evees.remote';
import { EveesHelpers } from '../graphql/evees.helpers';
import { GET_OTHER_PERSPECTIVES } from '../graphql/queries';

interface PerspectiveData {
  id: string;
  name: string;
  remote: string;
  creatorId: string;
  timestamp: number;
  context: string;
  title?: string;
}

export class EveesPerspectivesList extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVES-LIST');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'parent-context' })
  parentContext!: string;

  @property({ type: Array })
  hidePerspectives: string[] = [];

  @property({ type: Boolean, attribute: 'can-propose' })
  canPropose: Boolean = false;

  @property({ attribute: false })
  loadingPerspectives: boolean = true;

  @property({ attribute: false })
  otherPerspectivesData: PerspectiveData[] = [];

  @property({ attribute: false })
  canWrite: Boolean = false;

  perspectivesData: PerspectiveData[] = [];

  protected client!: ApolloClient<any>;
  protected remotes!: EveesRemote[];
  protected recognizer!: PatternRecognizer;

  async firstUpdated() {
    if (!this.isConnected) return;

    this.client = this.request(ApolloClientModule.bindings.Client);
    this.remotes = this.requestAll(EveesBindings.EveesRemote) as EveesRemote[];
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    this.load();
  }

  async load() {
    this.loadingPerspectives = true;
    const result = await this.client.query({
      query: GET_OTHER_PERSPECTIVES(this.perspectiveId),
    });

    /** data on other perspectives (proposals are injected on them) */
    const perspectivesData: PerspectiveData[] =
      result.data.entity.otherPerspectives === null
        ? []
        : await Promise.all(
            result.data.entity.otherPerspectives.map(
              async (entity): Promise<PerspectiveData> => {
                /** data on this perspective */
                const perspective = await this.client.query({
                  query: gql`{
                    entity(uref: "${entity.id}") {
                      id
                      name
                      head {
                        id                      
                      }
                      ... on Perspective {
                        payload {
                          remote
                          path
                          creatorId 
                          timestamp     
                          context                    
                        }
                      }
                    }
                  }`
                });            
                
                this.canWrite = await EveesHelpers.canWrite(
                  this.client,
                  this.perspectiveId
                );

                const {
                  data: {
                    entity: {
                      id,
                      name,
                      head,
                      payload: {
                        creatorId,                        
                        remote,
                        timestamp,
                        context
                      }
                    }
                  }
                } = perspective;

                const data = await EveesHelpers.getPerspectiveData(this.client, id);

                const title = (!data) ? undefined
                                      : (this.recognizer
                                        .recognizeBehaviours(data)
                                        .find((b) => (b as HasTitle).title)).title(data);
                return {
                  id,
                  name,
                  creatorId,
                  timestamp,
                  remote,
                  context,
                  title
                };
              }
            )
          );

    // remove duplicates
    const map = new Map<string, PerspectiveData>();
    perspectivesData.forEach((perspectiveData) =>
      map.set(perspectiveData.id, perspectiveData)
    );
    this.perspectivesData = Array.from(map, (key) => key[1]);

    this.otherPerspectivesData = this.perspectivesData.filter(
      (perspectiveData) => !this.hidePerspectives.includes(perspectiveData.id)
    );

    this.loadingPerspectives = false;

    this.logger.info('getOtherPersepectives() - get', {
      persperspectivesData: this.perspectivesData,
    });
  }

  perspectiveButtonClicked(event: Event, perspectiveData: PerspectiveData) {
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('merge-perspective', {
        bubbles: true,
        composed: true,
        detail: {
          perspectiveId: perspectiveData.id,
        },
      })
    );
  }

  renderLoading() {
    return html`
      <div class="loading-container">
        <uprtcl-loading></uprtcl-loading>
      </div>
    `;
  }

  render() {    
    return this.loadingPerspectives
      ? this.renderLoading()
      : this.otherPerspectivesData.length > 0
      ? html`
          <uprtcl-list activatable>
            ${this.otherPerspectivesData.map((perspectiveData) =>              
              html`
                <evees-perspective-row
                  perspective-id=${this.perspectiveId}
                  parent-context=${this.parentContext}
                  hasMeta
                  other-perspective-id=${perspectiveData.id}
                  creator-id=${perspectiveData.creatorId}
                  remote-id=${perspectiveData.remote}
                  context=${perspectiveData.context}
                  title=${perspectiveData.title}
                ></evees-perspective-row>
              `
            )}
          </uprtcl-list>
        `
      : html`
          <uprtcl-list-item>
            <i>No other perspectives found</i>
          </uprtcl-list-item>
        `;
  }

  static get styles() {
    return css`
      :host {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }

      .loading-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      uprtcl-list-item {
        user-select: none;
      }
      uprtcl-list-item evees-author {
        width: 100%;
      }
    `;
  }
}
