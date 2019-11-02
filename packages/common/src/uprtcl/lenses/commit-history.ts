import { Dictionary } from 'lodash';
import { Store } from 'redux';
import { LitElement, property, html, css, TemplateResult } from 'lit-element';

import { ReduxTypes, moduleConnect } from '@uprtcl/micro-orchestrator';
import { LensElement, Source, loadEntity, Hashed, DiscoveryTypes } from '@uprtcl/cortex';

import { Commit } from '../../types';
import { Secured } from '../../patterns/default-secured.pattern';

export class CommitHistory extends moduleConnect(LitElement)
  implements LensElement<Secured<Commit>> {
  @property({ type: Object })
  data!: Secured<Commit>;

  @property({ type: Object })
  commits: Dictionary<Secured<Commit>> = {};

  private store!: Store<any>;
  private source!: Source;

  firstUpdated() {
    this.store = this.request(ReduxTypes.Store);
    this.source = this.request(DiscoveryTypes.DiscoveryService);
    this.initialLoad();
  }

  async initialLoad() {
    this.commits = await this.loadCommitParents(this.data);
    this.commits[this.data.id] = this.data;
  }

  async loadCommitParents(commit: Secured<Commit>): Promise<Dictionary<Secured<Commit>>> {
    const parentsIds = commit.object.payload.parentsIds;

    const promises = parentsIds.map(async parentId =>
      this.store.dispatch(loadEntity(this.source)(parentId) as any)
    );
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
