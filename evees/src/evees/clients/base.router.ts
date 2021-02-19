import { CASStore } from '../../cas/interfaces/cas-store';
import { RemoteEvees } from '../interfaces/remote.evees';
import { EveesMutation, EveesMutationCreate } from '../interfaces/types';

// a base class to have reusable logic by other rotuers
export class BaseRouter {
  constructor(protected remotes: RemoteEvees[], protected store: CASStore) {}

  getRemote(remoteId: string): RemoteEvees {
    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`Remote not found for ${remoteId}`);
    return remote;
  }

  async getPerspectiveRemote(perspectiveId: string): Promise<RemoteEvees> {
    const perspective = await this.store.getEntity(perspectiveId);
    return this.getRemote(perspective.object.payload.remote);
  }

  async splitMutation(mutation: EveesMutationCreate): Promise<Map<string, EveesMutation>> {
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

    return mutationPerRemote;
  }
}
