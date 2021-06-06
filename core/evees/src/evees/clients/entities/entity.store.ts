import { Entity, EntityRemote, EntityResolver } from '../../interfaces';
import { EntityResolverBase } from './entity.resolver.base';
import { RouterEntityResolver } from './router.entity.resolver';

/** A cached and buffered entity store. It caches read entities using the EntityResolverBase, but also buffers new entities and persist
 * them at once when flush is called */
export class EntityStore extends EntityResolverBase implements EntityResolver {
  id: string = '';
  newEntitiesIds: Set<string> = new Set();

  constructor(public remotes: EntityRemote[], clientToEntityRemoteMap?: Map<string, string>) {
    super(new RouterEntityResolver(remotes, clientToEntityRemoteMap));
  }

  async putEntity(entity: Entity<any>): Promise<void> {
    this.newEntitiesIds.add(entity.hash);
    return this.cache.storeEntity(entity);
  }

  async flush(): Promise<void> {
    const entitiesPerRemote = new Map<string, Entity[]>();

    // Group entities per target remote
    await Promise.all(
      Array.from(this.newEntitiesIds.values()).map(async (entityId: string) => {
        const entity = await this.cache.getEntity(entityId);
        if (!entity) throw new Error('Entity');

        const entities = entitiesPerRemote.get(entity.remote) || [];
        entities.push(entity);

        entitiesPerRemote.set(entity.remote, entities);
      })
    );

    // persist on each remote
    await Promise.all(
      Array.from(entitiesPerRemote.entries()).map(([remoteId, entities]) => {
        const remote = this.remotes.find((r) => r.id === remoteId);
        if (!remote) throw new Error(`Remote ${remoteId} not found`);

        return remote.persistEntities(entities);
      })
    );
  }
}
