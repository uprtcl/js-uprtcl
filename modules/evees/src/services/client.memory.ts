import { Entity } from '@uprtcl/cortex';

import { UpdateRequest, NewPerspectiveData } from '../types';
import { EntityGetResult, Client, PerspectiveGetResult, EveesMutation } from './client';
import { Proposals } from './proposals';
import { SearchEngine } from './search.engine';

export class ClientOnMemory implements Client {
  private entities = new Map<string, Entity<any>>();
  private newPerspectives = new Map<string, NewPerspectiveData>();
  private updates = new Map<string, UpdateRequest>();
  private canUpdates = new Map<string, boolean>();

  constructor(protected base: Client) {}

  searchEngine?: SearchEngine | undefined;
  proposals?: Proposals | undefined;

  async getPerspective(perspectiveId: string): Promise<PerspectiveGetResult> {
    const newPerspective = this.newPerspectives.get(perspectiveId);
    if (newPerspective) {
      return {
        details: newPerspective.details,
      };
    }

    const update = this.updates.get(perspectiveId);
    if (update) {
      return {
        details: { headId: update.newHeadId },
      };
    }

    return this.base.getPerspective(perspectiveId);
  }
  createPerspectives(newPerspectives: NewPerspectiveData[]) {
    newPerspectives.forEach((newPerspective) => {
      this.newPerspectives.set(newPerspective.perspective.id, newPerspective);
    });
  }
  updatePerspectives(updates: UpdateRequest[]) {
    updates.forEach((update) => {
      this.updates.set(update.perspectiveId, update);
    });
  }
  async update(mutation: EveesMutation) {
    const create = mutation.newPerspectives
      ? this.createPerspectives(mutation.newPerspectives)
      : Promise.resolve();
    const update = mutation.updates ? this.updatePerspectives(mutation.updates) : Promise.resolve();
    return Promise.all([create, update]);
  }
  async storeEntities(objects: any[], remote?: string) {
    const entities = await this.base.hashEntities(objects, remote);
    entities.forEach((entity) => {
      this.entities.set(entity.id, entity);
    });
    return entities;
  }
  async hashEntities(objects: object[], remote?: string): Promise<Entity<any>[]> {
    return this.base.hashEntities(objects, remote);
  }

  async flush(): Promise<void> {
    await this.base.storeEntities(Array.from(this.entities.values()));
    await this.base.update({
      newPerspectives: Array.from(this.newPerspectives.values()),
      updates: Array.from(this.updates.values()),
    });

    this.entities.clear();
    this.newPerspectives.clear();
    this.updates.clear();
  }

  async canUpdate(userId: string, perspectiveId: string): Promise<boolean> {
    const canUpdate = this.canUpdates.get(perspectiveId);
    if (canUpdate !== undefined) {
      return canUpdate;
    }

    return this.base.canUpdate(userId, perspectiveId);
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

    const result = await this.base.getEntities(notFound);
    return {
      entities: found.concat(result.entities),
    };
  }
  async getEntity(uref: string): Promise<Entity<any>> {
    const { entities } = await this.getEntities([uref]);
    return entities[0];
  }

  async diff(): Promise<EveesMutation> {
    return {
      newPerspectives: Array.from(this.newPerspectives.values()),
      updates: Array.from(this.updates.values()),
      deletedPerspectives: [],
    };
  }
  storeEntity(object: object, remote?: any): Promise<string> {
    const entities = this.storeEntities([object], remote);
    return entities[0].id;
  }
}
