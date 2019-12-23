import { LitElement, property, html, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { GraphQlTypes } from '@uprtcl/common';

interface CommitHistoryData {
  id: string;
  entity: {
    message: string;
    timestamp: number;
    parentCommits: Array<CommitHistoryData>;
  };
}

export class CommitHistory extends moduleConnect(LitElement) {
  @property()
  headId!: string;

  @property({ type: Object })
  commitHistory: CommitHistoryData | undefined;

  async firstUpdated() {
    this.loadCommitHistory();
  }

  async loadCommitHistory() {
    this.commitHistory = undefined;

    const apolloClient: ApolloClient<any> = this.request(GraphQlTypes.Client);
    const result = await apolloClient.query({
      query: gql`
      {
        getEntity(id: "${this.headId}", depth: 1) {
          id
          entity {
            ... on Commit {
              message
              timestamp
              parentCommits {
                id
                entity {
                  ... on Commit {
                    message
                    timestamp
                    parentCommits {
                      id
                      entity {
                        ... on Commit {
                          timestamp
                          message
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
    });

    this.commitHistory = result.data.getEntity;
  }

  renderCommitHistory(commitHistory: CommitHistoryData) {
    return html`
      <div class="column">
        ${commitHistory.id} ${commitHistory.entity.message} ${commitHistory.entity.timestamp}
        ${commitHistory.entity.parentCommits
          ? html`
              <div class="row">
                ${commitHistory.entity.parentCommits.map(parent =>
                  this.renderCommitHistory(parent)
                )}
              </div>
            `
          : html``}
      </div>
    `;
  }

  render() {
    return html`
      <div class="row">
        ${this.commitHistory ? this.renderCommitHistory(this.commitHistory) : html``}
        <slot name="plugins"></slot>
      </div>
    `;
  }

  static get styles() {
    return css`
      .column {
        display: flex;
        flex-direction: column;
      }

      .row {
        display: flex;
        flex-direction: row;
      }
    `;
  }
}
