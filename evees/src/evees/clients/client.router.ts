import { CASStore } from '../../cas/interfaces/cas-store';
import { Client } from '../interfaces/client';
import { RemoteEvees } from '../interfaces/remote.evees';
import { SearchEngine } from '../interfaces/search.engine';
import {
  GetPerspectiveOptions,
  NewPerspective,
  Update,
  EveesMutation,
  EveesMutationCreate,
  PerspectiveGetResult,
} from '../interfaces/types';
import { Proposals } from '../proposals/proposals';
import { SearchEngineRouter } from './search.router';

export class RemoteRouter implements Client {
  proposals?: Proposals | undefined;
  searchEngine!: SearchEngine;

  constructor(protected remotes: RemoteEvees[], public store: CASStore) {
    this.searchEngine = new SearchEngineRouter(remotes);
  }

  getRemote(remoteId: string): RemoteEvees {
    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`Remote not found for ${remoteId}`);
    return remote;
  }

  async newPerspective(newPerspective: NewPerspective) {
    throw new Error('Method not implemented.');
  }
  async deletePerspective(perspectiveId: string) {
    throw new Error('Method not implemented.');
  }
  async updatePerspective(update: Update) {
    throw new Error('Method not implemented.');
  }

  async getPerspectiveRemote(perspectiveId: string): Promise<RemoteEvees> {
    const perspective = await this.store.getEntity(perspectiveId);
    return this.getRemote(perspective.object.payload.remote);
  }

  async getPerspective(
    perspectiveId: string,
    options: GetPerspectiveOptions
  ): Promise<PerspectiveGetResult> {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    return remote.getPerspective(perspectiveId, options);
  }

  async diff(): Promise<EveesMutation> {
    return {
      deletedPerspectives: [],
      newPerspectives: [],
      updates: [],
    };
  }

  async canUpdate(perspectiveId: string, userId?: string) {
    const remote = await this.getPerspectiveRemote(perspectiveId);
    return remote.canUpdate(perspectiveId, userId);
  }

  async update(mutation: EveesMutationCreate) {
    const mutationPerRemote = new Map<string, EveesMutation>();

    const fillDeleted = mutation.deletedPerspectives
      ? Promise.all(
          mutation.deletedPerspectives.map(
            async (deletedPerspective): Promise<void> => {
              const remote = await this.getPerspectiveRemote(deletedPerspective);
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                };
                mutationPerRemote.set(remote.id, mutation);
              }
              mutation.deletedPerspectives.push(deletedPerspective);
            }
          )
        )
      : Promise.resolve([]);

    const fillNew = mutation.newPerspectives
      ? Promise.all(
          mutation.newPerspectives.map(
            async (newPerspective): Promise<void> => {
              const remote = await this.getPerspectiveRemote(newPerspective.perspective.id);
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                };
                mutationPerRemote.set(remote.id, mutation);
              }
              mutation.newPerspectives.push(newPerspective);
            }
          )
        )
      : Promise.resolve([]);

    const fillUpdated = mutation.updates
      ? Promise.all(
          mutation.updates.map(
            async (update): Promise<void> => {
              const remote = await this.getPerspectiveRemote(update.perspectiveId);
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                };
                mutationPerRemote.set(remote.id, mutation);
              }
              mutation.updates.push(update);
            }
          )
        )
      : Promise.resolve([]);

    await Promise.all([fillDeleted, fillNew, fillUpdated]);

    /** at this point the mutation is split per remote and is sent to each remote */
    await Promise.all(
      Array.from(mutationPerRemote.keys()).map((remoteId) => {
        const mutation = mutationPerRemote.get(remoteId) as EveesMutation;
        const remote = this.getRemote(remoteId);
        return remote.update(mutation);
      })
    );
  }

  async flush() {}

  async refresh() {}

  /** get all user perspectives on all registered remotes */
  async getUserPerspectives(perspectiveId: string) {
    const all = await Promise.all(
      this.remotes.map((remote) => {
        return remote.getUserPerspectives(perspectiveId);
      })
    );
    return Array.prototype.concat.apply([], all);
  }
}
