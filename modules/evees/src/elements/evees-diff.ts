import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { Hashed, PatternRecognizer, CortexModule } from '@uprtcl/cortex';

import { UpdateRequest, HasDiffLenses } from '../types';
import { DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';

const LOGINFO = true;

export interface NodeDiff {
  toRef: string,
  fromRef?: string,
  oldData: Hashed<any>,
  newData: Hashed<any>,
  hasDiffLenses: HasDiffLenses,
}

export class UpdatedDiff extends moduleConnect(LitElement) {

  logger = new Logger('EVEES-DIFF');

  @property({ attribute: false })
  updates: UpdateRequest[] = [];

  @property({ attribute: false })
  loading: boolean = true;

  nodes: Dictionary<NodeDiff> = {};

  protected client: ApolloClient<any> | undefined = undefined;
  protected discovery: DiscoveryService | undefined = undefined;
  protected recognizer: PatternRecognizer | undefined = undefined;

  async firstUpdated() {
    this.logger.log('firstUpdated()', { updates: this.updates });
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.discovery = this.request(DiscoveryModule.bindings.DiscoveryService);
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

  getPatternOfObject<T>(object: object, patternName: string): T {
    const recognizer = this.recognizer as PatternRecognizer
    const pattern: T | undefined = recognizer
      .recognize(object)
      .find(prop => !!(prop as T)[patternName]);

    if (!pattern) throw new Error(`No "${patternName}" pattern registered for object ${JSON.stringify(object)}`);
    return pattern;
  }

  async loadUpdate(update: UpdateRequest) : Promise<void> {
    const client = this.client as ApolloClient<any>;
    const discovery = this.discovery as DiscoveryService;
    
    const resultNew = await client.query({
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
    const newData = await discovery.get(newDataId);

    if (!newData) throw new Error('data undefined');

    const resultOld = await client.query({
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
    const oldData = await discovery.get(oldDataId);

    if (!oldData) throw new Error('data undefined');

    const hasDiffLenses = this.getPatternOfObject<HasDiffLenses>(newData, 'diffLenses');
    if (!hasDiffLenses) throw Error('hasDiffLenses undefined');

    const node: NodeDiff = {
      toRef: update.perspectiveId, 
      fromRef: update.fromPerspectiveId, 
      newData,
      oldData,
      hasDiffLenses
    }
    
    if (LOGINFO) this.logger.log('loadNode()', {update, node});
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
    if (this.loading ) {
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
