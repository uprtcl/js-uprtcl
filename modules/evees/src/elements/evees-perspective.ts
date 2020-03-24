import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html } from 'lit-element';
import { randomColor } from 'randomcolor';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Pattern, Creatable, Signed } from '@uprtcl/cortex';

import { Secured } from '../patterns/default-secured.pattern';
import { UPDATE_HEAD } from '../graphql/queries';
import { UpdateContentEvent, ContentUpdatedEvent } from './events';
import { Perspective, Commit } from '../types';
import { EveesRemote } from '../services/evees.remote';
import { EveesBindings } from '../bindings';
import { CreateCommitArgs } from '../services/evees';


export const DEFAULT_COLOR = '#d0dae0';

export class EveesPerspective extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PERSPECTIVE');

  @property({ type: String, attribute: 'perspective-id' })
  firstPerspectiveId!: string;

  @property({ type: String, attribute: false })
  perspectiveId!: string;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor: string = 'undefined';

  @property({ type: Array })
  genealogy: string[] = [];

  @property({ type: Array, attribute: false })
  newGenealogy: string[] = [];

  @property({ type: Number })
  index: number = 0;

  @property()
  private entityId: string | undefined = undefined;

  private currentHeadId: string | undefined = undefined;
  private perspective: Secured<Perspective> | undefined = undefined;

  protected client: ApolloClient<any> | undefined = undefined;
  protected commitPatterns: Pattern[] | undefined = undefined;
  protected eveesRemotes: EveesRemote[] | undefined = undefined;

  firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.commitPatterns = this.requestAll(EveesBindings.CommitPattern);
    this.eveesRemotes = this.requestAll(EveesBindings.EveesRemote);

    this.logger.info('firstUpdated()', {
      firtPerspectiveId: this.firstPerspectiveId,
      genealogy: this.genealogy
    });
    
    this.perspectiveId = this.firstPerspectiveId;

    this.newGenealogy = [...this.genealogy];
    this.newGenealogy.unshift(this.perspectiveId);

    this.loadPerspective();
  }

  updated(changedProperties) {
    if (
      changedProperties.get('firstPerspectiveId') !== undefined ||
      changedProperties.get('perspectiveId') !== undefined
    ) {
      this.loadPerspective();
    }
  }

  async loadPerspective() {
    if (!this.client) throw new Error('client is undefined');

    this.requestUpdate();

    this.logger.info('loadPerspective() pre', this.perspectiveId);

    this.entityId = undefined;

    const result = await this.client.query({
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
              ... on Commit {
                data {
                  id
                }
              }
            }
          }
        }
      }
      `
    });

    this.entityId = result.data.entity.head.data.id;
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
    this.logger.info('checkoutPerspective()', { id });
    this.perspectiveId = id;
  }

  getEveeColor() {
    const base = this.eveeColor !== 'undefined' ? this.eveeColor : DEFAULT_COLOR;
    return this.perspectiveId === this.firstPerspectiveId
      ? base
      : randomColor({ seed: this.perspectiveId });
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('update-content', ((e: UpdateContentEvent) => {
      this.logger.info('CATCHED EVENT: update-content ', { perspectiveId: this.perspectiveId, e });
      e.stopPropagation();
      this.updateContent(e.detail.dataId);
    }) as EventListener);

    this.addEventListener('refresh-content', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: refresh-content ', { perspectiveId: this.perspectiveId, e });
      e.stopPropagation();
      this.loadPerspective();
    }) as EventListener);

    this.addEventListener('checkout-perspective', ((e: CustomEvent) => {
      this.logger.info('CATCHED EVENT: checkout-perspective ', {
        perspectiveId: this.perspectiveId,
        e
      });
      e.stopPropagation();
      this.checkoutPerspective(e.detail.perspectiveId);
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
  }

  filterCreatePattern(patterns) {
    const create: Creatable<any, any> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as Creatable<any, any>).create
    ) as unknown) as Creatable<any, any>;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
  }

  getCommitCreatePattern() {
    if(!this.commitPatterns) throw new Error('commitPatterns undefined');
    return this.filterCreatePattern(this.commitPatterns);
  }

  async updateContent(dataId: string) {
    if (!this.perspectiveId) return;
    if (!this.perspective) return;

    if (!this.client) throw new Error('client is undefined');
    if(!this.eveesRemotes) throw new Error('eveesRemotes undefined');

    const origin = this.perspective.object.payload.origin;

    const remote = this.eveesRemotes.find(r => r.authority === origin);

    if (!remote) return;

    this.logger.info('updateContent() pre', dataId);

    const createCommit: Creatable<CreateCommitArgs, Signed<Commit>> = this.getCommitCreatePattern();

    const commit: Secured<Commit> = await createCommit.create()(
      {
        parentsIds: this.currentHeadId ? [this.currentHeadId] : [],
        dataId
      },
      remote.source
    );

    const headUpdate = await this.client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.perspectiveId,
        headId: commit.id
      }
    });

    this.currentHeadId = commit.id;
    this.entityId = dataId;

    this.logger.info('updateContent() post', this.entityId);

    /** let upper levels know something changed */
    if (this.genealogy.length === 0) {
      this.dispatchEvent(new ContentUpdatedEvent({
        bubbles: true,
        composed: true,
        detail: { perspectiveId: this.perspectiveId }
      }));
    }
  }

  render() {
    if (this.entityId === undefined || this.perspective === undefined) {
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;
    }

    return html`
      <cortex-entity
        hash=${this.entityId}
        lens-type="content"
        .context=${{
          ref: this.perspective.id,
          color: this.getEveeColor(),
          index: this.index,
          genealogy: this.newGenealogy
        }}
      >
        <evees-info-popper
          slot="evee-popper"
          first-perspective-id=${this.firstPerspectiveId}
          perspective-id=${this.perspectiveId}
          evee-color=${this.getEveeColor()}
        ></evees-info-popper>
        <evees-info-page
          slot="evee-page"
          first-perspective-id=${this.firstPerspectiveId}
          perspective-id=${this.perspectiveId}
          evee-color=${this.getEveeColor()}
        ></evees-info-page>
      </cortex-entity>
    `;
  }
}
