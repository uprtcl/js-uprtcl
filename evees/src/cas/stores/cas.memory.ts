import { ObjectOnRemote } from '../../evees/interfaces/client';

import { CASStore, EntityGetResult } from '../interfaces/cas-store';
import { Entity } from '../interfaces/entity';

export class CASOnMemory implements CASStore {
  private entities = new Map<string, Entity<any>>();
  private cachedEntities = new Map<string, Entity<any>>();

  constructor(protected base: CASStore, objects?: ObjectOnRemote[]) {
    if (objects) {
      this.storeEntities(objects);
    }
  }

  async hashEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    return this.base.hashEntities(objects);
  }

  async flush(): Promise<void> {
    await this.base.createEntities(this.entities);
    this.entities.clear();
  }

  async getEntities(hashes: string[]): Promise<EntityGetResult> {
    const found: Entity<any>[] = [];
    const notFound: string[] = [];

    hashes.forEach((hash) => {
      const entity = this.entities.get(hash);
      if (entity) {
        found.push(entity);
      } else {
        notFound.push(hash);
      }
    });

    if (notFound.length === 0) {
      return {
        entities: found,
      };
    }

    // ask the base client
    const result = await this.base.getEntities(notFound);
    const entities = found.concat(result.entities);

    // cache locally
    entities.forEach((entity) => {
      this.cachedEntities.set(entity.id, entity);
    });

    return { entities };
  }

  storeEntities(objects: ObjectOnRemote[]): Promise<Entity<any>[]> {
    throw new Error('Method not implemented.');
  }

  storeEntity(object: ObjectOnRemote): Promise<string> {
    const entities = this.storeEntities([object]);
    return entities[0].id;
  }

  async getEntity(uref: string): Promise<Entity<any>> {
    const { entities } = await this.getEntities([uref]);
    return entities[0];
  }

  hashEntity(object: object, remote: string): Promise<string> {
    return this.base.hashEntity(object, remote);
  }
}
