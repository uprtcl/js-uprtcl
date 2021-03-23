import { EntityCreate } from '../../cas/interfaces/entity';
import { CASOnMemory } from '../../cas/stores/cas.memory';
import { CASStore } from '../../cas/interfaces/cas-store';
import { RemoteEvees } from '../interfaces/remote.evees';
import { EveesMutationCreate, NewPerspective, Update } from '../interfaces/types';

// a base class to have reusable logic by other rotuers
export class BaseRouter {
  constructor(protected remotes: RemoteEvees[], protected store: CASStore) {}

  getRemote(remoteId: string): RemoteEvees {
    const remote = this.remotes.find((r) => r.id === remoteId);
    if (!remote) throw new Error(`Remote not found for ${remoteId}`);
    return remote;
  }

  async getPerspectiveRemote(perspectiveId: string, store?: CASStore): Promise<RemoteEvees> {
    const useStore = store ? store : this.store;
    const perspective = await useStore.getEntity(perspectiveId);
    return this.getRemote(perspective.object.payload.remote);
  }

  async splitMutation(mutation: EveesMutationCreate): Promise<Map<string, EveesMutationCreate>> {
    const mutationPerRemote = new Map<string, EveesMutationCreate>();

    let storeLocal: CASStore | undefined = undefined;

    if (mutation.entities) {
      /** create a temporary store with the mutation entities for them
       * to be available */
      storeLocal = new CASOnMemory(this.store);
      await storeLocal.storeEntities(mutation.entities);
    }

    const fillEntities = mutation.entities
      ? Promise.all(
          mutation.entities.map(
            async (entity): Promise<void> => {
              if (!entity.remote) {
                throw new Error('entities must include what remote the should go to');
              }
              const remote = entity.remote;
              let mutation = mutationPerRemote.get(remote);

              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entities: [],
                };
                mutationPerRemote.set(remote, mutation);
              }
              (mutation.entities as EntityCreate[]).push(entity);
            }
          )
        )
      : Promise.resolve([]);

    const fillDeleted = mutation.deletedPerspectives
      ? Promise.all(
          mutation.deletedPerspectives.map(
            async (deletedPerspective): Promise<void> => {
              const remote = await this.getPerspectiveRemote(deletedPerspective, storeLocal);
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entities: [],
                };
                mutationPerRemote.set(remote.id, mutation);
              }
              (mutation.deletedPerspectives as string[]).push(deletedPerspective);
            }
          )
        )
      : Promise.resolve([]);

    const fillNew = mutation.newPerspectives
      ? Promise.all(
          mutation.newPerspectives.map(
            async (newPerspective): Promise<void> => {
              const remote = await this.getPerspectiveRemote(
                newPerspective.perspective.id,
                storeLocal
              );
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entities: [],
                };
                mutationPerRemote.set(remote.id, mutation);
              }
              (mutation.newPerspectives as NewPerspective[]).push(newPerspective);
            }
          )
        )
      : Promise.resolve([]);

    const fillUpdated = mutation.updates
      ? Promise.all(
          mutation.updates.map(
            async (update): Promise<void> => {
              const remote = await this.getPerspectiveRemote(update.perspectiveId, storeLocal);
              let mutation = mutationPerRemote.get(remote.id);
              if (!mutation) {
                mutation = {
                  deletedPerspectives: [],
                  newPerspectives: [],
                  updates: [],
                  entities: [],
                };
                mutationPerRemote.set(remote.id, mutation);
              }
              (mutation.updates as Update[]).push(update);
            }
          )
        )
      : Promise.resolve([]);

    await Promise.all([fillEntities, fillDeleted, fillNew, fillUpdated]);

    return mutationPerRemote;
  }
}
