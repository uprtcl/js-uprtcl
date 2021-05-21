import { EntityRemote } from '../../interfaces/entity.remote';
import { Entity, EntityCreate } from '../../interfaces/entity';
import { EntityResolver } from '../../interfaces/entity.resolver';

/** The entity router is used to get entities from all CASRemotes.
 * It is NOT used to persist new entities.
 * New entities are persisted from the ClientRemotes so that it's only done
 * when persisting cached mutations */
export class RouterEntityResolver implements EntityResolver {
  remotesMap: Map<string, EntityRemote>;

  constructor(
    protected remotes: EntityRemote[],
    protected clientToEntityRemoteMap: Map<string, string>
  ) {
    this.remotesMap = new Map();
    remotes.forEach((remote) => {
      this.remotesMap.set(remote.id, remote);
    });
  }

  putEntities(entities: Entity[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  putEntity(entity: Entity<any>): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entities = await this.getEntities([hash]);
    return entities[0];
  }

  getEntities(hashes: string[]): Promise<Entity<any>[]> {
    return this.tryGetFromSources(hashes);
  }

  hashObjects(entities: EntityCreate<any>[]): Promise<Entity<any>[]> {
    return Promise.all(entities.map((entity) => this.hashOnRemote(entity)));
  }

  removeEntity(entityId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async hashObject<T = any>(entity: EntityCreate<any>): Promise<Entity<T>> {
    const entities = await this.hashObjects([entity]);
    return entities[0];
  }

  getObjectRemote(entity: EntityCreate): EntityRemote {
    if (!entity.remote) throw new Error(`Entity remote not defined ${JSON.stringify(entity)}`);
    const entityRemoteId = this.clientToEntityRemoteMap.get(entity.remote);
    if (!entityRemoteId) throw new Error(`Entity remote id not found for remote ${entity.remote}`);
    return this.getRemote();
  }

  public async hashOnRemote(entity: EntityCreate) {
    const store = this.getObjectRemote(entity);
    return store.hashObject(entity);
  }

  public getRemote(id?: string): EntityRemote {
    const remote = id ? this.remotesMap.get(id) : this.remotes[0];
    if (!remote) throw new Error(`Source not found for id ${id}`);
    return remote;
  }

  public async getFromRemote(hashes: string[], id: string): Promise<Entity[]> {
    const remote = this.getRemote(id);
    if (!remote) throw new Error(`Source ${id} not found`);
    return remote.getEntities(hashes);
  }

  private async tryGetFromSources(hashes: string[]): Promise<Entity[]> {
    const requestedOn: string[] = [];
    const allObjects: Map<string, Entity> = new Map();

    return new Promise((resolve) => {
      Array.from(this.remotesMap.keys()).map(async (casID) => {
        try {
          const entities = await this.getFromRemote(hashes, casID);
          requestedOn.push(casID);

          // append to all found objects (prevent duplicates)
          entities.map((e) => allObjects.set(e.hash, e));

          // if found as many objects as hashes requested, resove (dont wait for other sources to return)
          if (entities.length === hashes.length) {
            resolve(Array.from(allObjects.values()));
          }
        } catch (e) {
          // a failure to get objects from a source is consider as objects not present
          requestedOn.push(casID);
        }

        // resolve once all sources have been requested
        if (requestedOn.length === this.remotesMap.size) {
          resolve(Array.from(allObjects.values()));
        }
      });
    });
  }
}
