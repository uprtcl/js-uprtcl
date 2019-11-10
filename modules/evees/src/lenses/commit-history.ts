import { Dictionary } from 'lodash';
import { LitElement, property, html, css, TemplateResult } from 'lit-element';

import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { LensElement } from '@uprtcl/lenses';
import { Secured } from '@uprtcl/common';

import { Commit } from '../types';

export class CommitHistory extends reduxConnect(LitElement)
  implements LensElement<Secured<Commit>> {
  @property({ type: Object })
  data!: Secured<Commit>;

  @property({ type: Object })
  commits: Dictionary<Secured<Commit>> = {};

  @property({ type: Number })
  commitsToShow!: number;

  firstUpdated() {
    this.initialLoad();
  }

  async initialLoad() {
    this.commits = await this.loadCommitParents(this.data);
    this.commits[this.data.id] = this.data;
  }

  async loadCommitParents(commit: Secured<Commit>): Promise<Dictionary<Secured<Commit>>> {
    const parentsIds = commit.object.payload.parentsIds;

    /* const promises = parentsIds.map(async parentId =>
      this.store.dispatch(loadEntity(this.source)(parentId) as any)
    ); */
    const promises = [];
    const commits: Secured<Commit>[] = await Promise.all(promises);
    const ancestorCommitsPromises = commits.map(commit => this.loadCommitParents(commit));

    const ancestorsArray = await Promise.all(ancestorCommitsPromises);
    const ancestorsDict = ancestorsArray.reduce(
      (commits, commitArray) => ({ ...commits, ...commitArray }),
      {}
    );

    return { ...ancestorsDict, ...this.arrayToDict(commits) };
  }

  arrayToDict<T extends object>(array: Array<Hashed<T>>): Dictionary<Hashed<T>> {
    return array.reduce((objects, object) => ({ ...objects, [object.id]: object }), {});
  }

  renderCommit(commitHash: string): TemplateResult {
    const commit = this.commits[commitHash];
    return html`
      ${commit
        ? html`
            <div class="column">
              ${commit.id} ${commit.object.payload.message} ${commit.object.payload.timestamp}

              <div class="row">
                ${commit.object.payload.parentsIds.map(parentId => this.renderCommit(parentId))}
              </div>
            </div>
          `
        : html``}
    `;
  }

  render() {
    return html`
      ${this.renderCommit(this.data.id)}
    `;
  }

  static get styles(): CSSResult {
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
