import { Dictionary } from 'lodash';
import { LitElement, property, html, css, TemplateResult } from 'lit-element';
import { connect } from 'pwa-helpers/connect-mixin';
import { Store } from 'redux';
import { LensElement, Secured, Source, loadEntity, Hashed } from '@uprtcl/cortex';
import { Commit } from '../types';

export function CommitHistory(source: Source, store: Store<any>): typeof HTMLElement {
  class CommitHistory extends connect(store)(LitElement) implements LensElement<Secured<Commit>> {
    @property({ type: Object })
    data!: Secured<Commit>;

    @property({ type: Object })
    commits: Dictionary<Secured<Commit>> = {};

    firstUpdated() {
      this.initialLoad();
    }

    async initialLoad() {
      this.commits = await this.loadCommitParents(this.data);
      this.commits[this.data.id] = this.data;
    }

    async loadCommitParents(commit: Secured<Commit>): Promise<Dictionary<Secured<Commit>>> {
      const parentsIds = commit.object.payload.parentsIds;

      const promises = parentsIds.map(async parentId =>
        store.dispatch(loadEntity(source)(parentId) as any)
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

  return CommitHistory;
}
