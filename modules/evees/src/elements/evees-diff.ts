import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { PatternRecognizer, CortexModule, Entity } from '@uprtcl/cortex';

import { UpdateRequest, HasDiffLenses } from '../types';
import { loadEntity } from '@uprtcl/multiplatform';

const LOGINFO = true;

export interface NodeDiff {
  toRef: string;
  fromRef?: string;
  oldData: Entity<any>;
  newData: Entity<any>;
  hasDiffLenses: HasDiffLenses;
}

export class UpdatedDiff extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-DIFF');

  @property({ attribute: false })
  updates: UpdateRequest[] = [];

  @property({ attribute: false })
  loading: boolean = true;

  nodes: Dictionary<NodeDiff> = {};

  protected client!: ApolloClient<any>;
  protected recognizer!: PatternRecognizer;

  async firstUpdated() {
    this.logger.log('firstUpdated()', { updates: this.updates });
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);

    this.loadNodes();
  }

  async updated(changedProperties) {
    this.logger.log('updated()', { updates: this.updates, changedProperties });
  }

  async loadNodes() {
    this.loading = true;

    const update = this.updates.map(update => this.loadUpdate(update));
    await Promise.all(update);

    this.loading = false;
  }


  async loadUpdate(update: UpdateRequest): Promise<void> {
    const resultNew = await this.client.query({
      query: gql`
      {
        entity(ref: "${update.newHeadId}") {
          id 
          ... on Commit {
            data {
              id
            }
          }
        }
      }`
    });

    const newDataId = resultNew.data.entity.data.id;
    const newData = await loadEntity(this.client, newDataId);

    if (!newData) throw new Error('data undefined');

    const resultOld = await this.client.query({
      query: gql`
      {
        entity(ref: "${update.oldHeadId}") {
          id 
          ... on Commit {
            data {
              id
            }
          }
        }
      }`
    });

    const oldDataId = resultOld.data.entity.data.id;
    const oldData = await loadEntity(this.client, oldDataId);

    if (!oldData) throw new Error('data undefined');

    const hasDiffLenses = this.recognizer.recognizeBehaviours(newData).find(b => (b as HasDiffLenses<any>).diffLenses);
    if (!hasDiffLenses) throw Error('hasDiffLenses undefined');

    const node: NodeDiff = {
      toRef: update.perspectiveId,
      fromRef: update.fromPerspectiveId,
      newData,
      oldData,
      hasDiffLenses
    };

    if (LOGINFO) this.logger.log('loadNode()', { update, node });
    this.nodes[update.perspectiveId] = node;
  }

  renderUpdatedDiff(ref: string) {
    // TODO: review if old data needs to be
    const node = this.nodes[ref];

    const nodeLense = node.hasDiffLenses.diffLenses()[0];
    return html`
      <div class="evee-diff">
        ${nodeLense.render(node.newData, node.oldData)}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;
    }

    return this.updates.map(update => this.renderUpdatedDiff(update.perspectiveId));
  }

  static get styles() {
    return css``;
  }
}
