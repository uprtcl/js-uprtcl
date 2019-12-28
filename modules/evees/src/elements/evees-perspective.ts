import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { GraphQlTypes } from '@uprtcl/common';

import { UPDATE_HEAD, CREATE_COMMIT } from '../graphql/queries';
import { UpdateContentEvent } from './events';

export class EveesPerspective extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  private currentHeadId: string | undefined = undefined;

  @property()
  private entityId: string | undefined = undefined;

  firstUpdated() {
    this.loadPerspective();
  }

  async loadPerspective() {
    this.entityId = undefined;

    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);

    const result = await client.query({
      query: gql`
      {
        getEntity(id: "${this.perspectiveId}") {
          id
          raw
          entity {
            ... on Perspective {
              head {
                id
              }
            }
          }
          content {
            id
          }
        }
      }
      `
    });

    this.entityId = result.data.getEntity.content.id;
    const head = result.data.getEntity.entity.head;
    this.currentHeadId = head ? head.id : undefined;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('update-content', ((e: UpdateContentEvent) => {
      e.stopPropagation();
      this.updateContent(e.detail.dataId);
    }) as EventListener);
  }

  async updateContent(dataId: string) {
    if (!this.perspectiveId) return;
    const client: ApolloClient<any> = this.request(GraphQlTypes.Client);

    this.entityId = undefined;

    const parentsIds = this.currentHeadId ? [this.currentHeadId] : [];

    const result = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        parentsIds,
        dataId
      }
    });

    const headUpdate = await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.perspectiveId,
        headId: result.data.createCommit.id
      }
    });

    this.currentHeadId = result.data.createCommit.id;
    this.entityId = headUpdate.data.updatePerspectiveHead.content.id;
  }

  render() {
    if (this.entityId === undefined) {
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;
    }

    return html`
      <div class="evee-info"></div>
      <cortex-entity .hash=${this.entityId} lens-type="content"></cortex-entity>
    `;
  }
}
