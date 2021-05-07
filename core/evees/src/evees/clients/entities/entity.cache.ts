import { Entity } from 'src/evees/interfaces/entity';
import { EntityCache } from 'src/evees/interfaces/entity.cache';

export class OnMemoryEntityCache implements EntityCache {
  private entities = new Map<string, Entity>();

  async getEntities(hashes: string[]): Promise<Entity<any>[]> {
    return Promise.all(hashes.map((hash) => this.getEntity(hash)));
  }

  async getEntity<T = any>(hash: string): Promise<Entity<T>> {
    const entity = this.entities.get(hash);
    if (!entity) {
      throw new Error(`Entity ${hash} not found`);
    }
    return entity;
  }

  async storeEntity(entity: Entity<any>): Promise<void> {
    this.entities.set(entity.hash, entity);
  }

  async storeEntities(entities: Entity<any>[]): Promise<void> {
    await Promise.all(entities.map((entity) => this.storeEntity(entity)));
  }

  async removeEntity(hash: string): Promise<void> {
    this.entities.delete(hash);
  }
}
