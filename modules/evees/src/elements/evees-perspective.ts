import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { Secured, GraphQlTypes, Updatable } from '@uprtcl/common';
import { PatternRecognizer, CortexTypes } from '@uprtcl/cortex';

import { Perspective } from '../types';

export class EveesPerspective extends moduleConnect(LitElement) {
  @property({ type: String, attribute: 'perspective-id' })
  perspectiveId!: string;

  @property({ attribute: false })
  private perspective!: Secured<Perspective>;

  @property({ attribute: false })
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
          content {
            id
          }
        }
      }
      `
    });

    this.entityId = result.data.getEntity.content.id;
    this.perspective = result.data.getEntity.raw;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('content-changed', ((e: CustomEvent) => {
      e.stopPropagation();
      this.updateContent(e.detail.newContent);
    }) as EventListener);
  }

  async updateContent(newContent: any) {
    if (!this.perspectiveId) return;

    const recognizer: PatternRecognizer = this.request(CortexTypes.Recognizer);
    const updatable: Updatable<any, any> | undefined = recognizer.recognizeUniqueProperty(
      this.perspective,
      prop => !!(prop as Updatable<any, any>).update
    );

    if (updatable) {
      await updatable.update(this.perspective)(newContent);
      this.loadPerspective();
    }
  }

  render() {
    if (!this.entityId)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    return html`
      <div class="evee-info"></div>
      <cortex-entity .hash=${this.entityId} lens-type="content"></cortex-entity>
    `;
  }
}
