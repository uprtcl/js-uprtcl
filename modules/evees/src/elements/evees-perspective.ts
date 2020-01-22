import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Secured } from '../patterns/default-secured.pattern';
import { UPDATE_HEAD, CREATE_COMMIT } from '../graphql/queries';
import { UpdateContentEvent } from './events';
import { Perspective } from '../types';

export class EveesPerspective extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVE');

  @property({ type: String, attribute: 'perspective-id' })
  firtPerspectiveId!: string;

  @property({ type: String, attribute: false })
  perspectiveId!: string;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor: String | undefined = undefined;

  private currentHeadId: string | undefined = undefined;
  private perspective: Secured<Perspective> | undefined = undefined;

  @property()
  private entityId: string | undefined = undefined;

  firstUpdated() {
    this.perspectiveId = this.firtPerspectiveId;
    this.loadPerspective();
  }

  async loadPerspective() {
    this.entityId = undefined;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    this.logger.info('loadPerspective() pre', this.perspectiveId);

    const result = await client.query({
      query: gql`
      {
        entity(id: "${this.perspectiveId}") {
          id
          ... on Perspective {
            payload {
              creatorId
              origin
              timestamp
            }
            head {
              id
            }
          }
          _context {
            patterns {
              content {
                id
              }
            }
          }
        }
      }
      `
    });

    this.entityId = result.data.entity._context.patterns.content.id;
    const head = result.data.entity.head;
    this.currentHeadId = head ? head.id : undefined;

    this.perspective = {
      id: result.data.entity.id,
      object: {
        payload: {
          origin: result.data.entity.payload.origin,
          creatorId: result.data.entity.payload.creatorId,
          timestamp: result.data.entity.payload.timestamp
        },
        proof: {
          signature: '',
          type: ''
        }
      }
    };

    this.logger.info('loadPerspective() post', {
      result,
      entityId: this.entityId,
      currentHeadId: this.currentHeadId
    });
  }

  checkoutPerspective(id: string) {
    this.perspectiveId = id;
    this.loadPerspective();
  }

  getEveeColor() {
    const base = this.eveeColor !== 'undefined' ? this.eveeColor : 'blue';
    return this.perspectiveId === this.firtPerspectiveId ? base : 'red';
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('update-content', ((e: UpdateContentEvent) => {
      this.logger.info('CATCHED EVENT: update-content ', { perspectiveId: this.perspectiveId, e });
      e.stopPropagation();
      this.updateContent(e.detail.dataId);
    }) as EventListener);

    this.addEventListener('create-sibling', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: create-sibling ', { perspectiveId: this.perspectiveId, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.after === this.perspectiveId) return;

      e.stopPropagation();
      this.dispatchEvent(
        new CustomEvent('create-sibling', {
          bubbles: true,
          composed: true,
          detail: {
            after: this.perspectiveId
          }
        })
      );
    }) as EventListener);

    this.addEventListener('perspective-selected', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: perspective-selected ', {
        perspectiveId: this.perspectiveId,
        e
      });
      e.stopPropagation();
      this.checkoutPerspective(e.detail.id);
    }) as EventListener);
  }

  async updateContent(dataId: string) {
    if (!this.perspectiveId) return;
    if (!this.perspective) return;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    this.logger.info('updateContent() pre', dataId);

    this.entityId = undefined;

    const commitUpdate = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        parentsIds: this.currentHeadId ? [this.currentHeadId] : [],
        dataId,
        usl: this.perspective.object.payload.origin
      }
    });

    const headUpdate = await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.perspectiveId,
        headId: commitUpdate.data.createCommit.id
      }
    });

    this.currentHeadId = commitUpdate.data.createCommit.id;
    this.entityId = headUpdate.data.updatePerspectiveHead.id;

    this.logger.info('updateContent() post', this.entityId);
  }

  render() {
    if (this.entityId === undefined || this.perspective === undefined) {
      return html`
        <cortex-loading-placeholder>loading perspective...</cortex-loading-placeholder>
      `;
    }

    return html`
      <cortex-entity
        .hash=${this.entityId}
        lens-type="content"
        .context=${{ perspective: this.perspective, color: this.getEveeColor() }}
      >
        <evees-info
          slot="evee"
          perspective-id=${this.perspectiveId}
          evee-color=${this.getEveeColor()}
        ></evees-info>
      </cortex-entity>
    `;
  }
}
