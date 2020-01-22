import { LitElement, property, html, css } from 'lit-element';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
      propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
      return `${styleString}${propName}:${propValue};`;
  }, '');
}


import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { ApolloClient, gql } from 'apollo-boost';
import { PerspectiveData, EveesTypes } from '../types';
import { ApolloClientModule } from '@uprtcl/common';
import { Evees, NewPerspectiveArgs } from '../services/evees';
import { CREATE_COMMIT, CREATE_PERSPECTIVE, EveesModule, MergeStrategy } from '../uprtcl-evees';

export interface TextNode {
  text: string;
  type: string;
  links: string[];
}
export class EveesInfo extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-INFO');

  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ attribute: false })
  show: Boolean = false;

  perspectiveData!: PerspectiveData;

  firstUpdated() {
    this.load();
  }

  updated() {
    this.load();
  }

  async load() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);
    const result = await client.query({
      query: gql`
        {
          entity(id: "${this.perspectiveId}") {
            id
            ... on Perspective {
              context {
                identifier
              }
              head {
                id
              }
              name
              payload {
                origin
                creatorId
                timestamp
              }
            }
            _patterns {
              accessControl {
                canWrite
              }
            }
          }
        }
      `
    });

    this.perspectiveData = {
      id: result.data.entity.id,
      details: {
        context: result.data.entity.context.identifier,
        headId: result.data.entity.head.id,
        name: result.data.entity.name
      },
      perspective: result.data.entity.payload,
      canWrite: result.data.entity._patterns.accessControl
        ? result.data.entity._patterns.accessControl.canWrite
        : true
    };

    this.logger.info('load', { perspectiveData: this.perspectiveData });
  }

  async createGlobalPerspective(perspectiveId: string): Promise<string> {
    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);
    const { remoteLinks }: Dictionary<string> = this.request(EveesModule.id);

    this.logger.info('createGlobalPerspective()', { perspectiveId });

    const queryResult = await client.query({
      query: gql`{
        entity(id: "${perspectiveId}") {
          id
          ... on Perspective {
            context {
              identifier
            }
            head {
              id
            }
            payload {
              origin
            }
          }
          _patterns {
            content {
              id
              ... on TextNode {
                text
                type
                links {
                  id
                }
              }
            }
          }
        }
      }`
    });

    /** maybe we will have to skip apollo here to be able to get an entity with all
     * its content without knowing it before hand. Something like
     * data:any = this.getEntity(id)
     * and use pattern-based get and set links like you were doing with perspective-pattern
     */
    const data: TextNode = {
      text: queryResult.data.entity._patterns.content.text,
      type: queryResult.data.entity._patterns.content.type,
      links: queryResult.data.entity._patterns.content.links.map(l => l.id)
    };

    /** this perspective details */
    const orgHeadId = queryResult.data.entity.head.id;
    let newCommitId = orgHeadId;
    const context = queryResult.data.entity.context.identifier;
    const origin = queryResult.data.entity.payload.origin;

    this.logger.info('createGlobalPerspective() - data', { data });

    let newLinks = data.links;

    for (let i = 0; i < data.links.length; i++) {
      const childPerspectiveId = data.links[i];
      /** recursive call!!! */
      const childNewPerspectiveId = await this.createGlobalPerspective(childPerspectiveId);
      newLinks[i] = childNewPerspectiveId;
    }

    /** create a new commit on the parent to point to the new perspectives of the children */
    if (data.links.length > 0) {
      // text node... ouch, do we need a pattern-based mutation?
      let newNode: TextNode = {
        ...data,
        links: newLinks
      };

      const dataUsl = remoteLinks[origin];

      const textNodeMutation = await client.mutate({
        mutation: gql`
          mutation CreateTextNode($content: TextNodeInput!, $usl: ID) {
            createTextNode(content: $content, usl: $usl) {
              id
            }
          }
        `,
        variables: {
          content: newNode,
          usl: dataUsl
        }
      });

      const commitMutation = await client.mutate({
        mutation: CREATE_COMMIT,
        variables: {
          dataId: textNodeMutation.data.createTextNode.id,
          parentsIds: [orgHeadId],
          message: 'automatic commit during new global perspective',
          usl: origin
        }
      });

      newCommitId = commitMutation.data.createCommit.id;
    }

    /** create the new perspective */
    const perspectiveMutation = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        headId: newCommitId,
        context: context,
        usl: origin
      }
    });

    this.logger.info('createGlobalPerspective() - perspective', { perspectiveMutation });

    return perspectiveMutation.data.createPerspective.id;
  }


  async merge(fromPerspectiveId: string) {
    if (!fromPerspectiveId) return;
    
    this.logger.info('merge()', { perspectiveId: this.perspectiveId, fromPerspectiveId });

    const merge: MergeStrategy = this.request(EveesTypes.MergeStrategy);
    const updateRequests = await merge.mergePerspectives(
      this.perspectiveId,
      fromPerspectiveId
    );
    console.log(updateRequests);
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('merge-perspective', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: merge-perspective', { perspectiveId: this.perspectiveId, e });

      e.stopPropagation();
      this.merge(e.detail.id);
    }) as EventListener);
  }

  showClicked() {
    this.show = !this.show;
  }

  async newPerspectiveClicked() {
    const newPerspectiveId = await this.createGlobalPerspective(this.perspectiveId);
    this.show = false;

    this.logger.info('newPerspectiveClicked() - perspective created', { newPerspectiveId });

    this.dispatchEvent(
      new CustomEvent('checkout-perspective', {
        detail: {
          perspectiveId: newPerspectiveId
        }
      })
    );
  }

  renderLoading() {
    return html`
      loading perspective data ...<mwc-circular-progress></mwc-circular-progress>
    `;
  }

  render() {
    return html`
      <div class="container">
        <div
          class="button"
          style=${styleMap({ backgroundColor: this.eveeColor })}
          @click=${this.showClicked}
        ></div>
        ${this.show
          ? html`
              <div class="info-box">
                ${this.perspectiveData
                  ? html`
                      <div class="perspective-details">
                        context: ${this.perspectiveData.details.context}<br />
                        id: ${this.perspectiveData.id}<br />
                        name: ${this.perspectiveData.details.name}<br />
                        origin: ${this.perspectiveData.perspective.origin}<br />
                        headId: ${this.perspectiveData.details.headId}
                      </div>
                      <div>
                        <evees-perspectives-list
                          perspective-id=${this.perspectiveId}
                        ></evees-perspectives-list>
                        <button @click=${this.newPerspectiveClicked}>new perspective</button>
                      </div>
                    `
                  : this.renderLoading()}
              </div>
            `
          : ''}
      </div>
    `;
  }

  static get styles() {
    return css`
      .container {
        position: relative;
        height: 100%;
        width: 15px;
      }
      .button {
        height: calc(100% - 10px);
        margin-top: 5px;
        margin-left: 5px;
        width: 10px;
        border-radius: 3px;
        cursor: pointer;
      }
      .button:hover {
        background-color: #cccccc;
      }
      .info-box {
        z-index: 20;
        position: absolute;
        right: -364px;
        top: 0;
        width: 300px;
        min-height: 300px;
        background-color: white;
        box-shadow: 2px 2px 3px 0px rgba(71,60,71,0.75);
        padding: 32px;
        border-top-right-radius: 12px;
        border-bottom-right-radius: 12px;
        border-bottom-left-radius: 12px;
      }
    `;
  }
}
