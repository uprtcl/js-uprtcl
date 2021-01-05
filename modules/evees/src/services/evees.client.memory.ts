import { Entity } from '@uprtcl/cortex';

import { UpdateRequest, NewPerspectiveData } from '../types';
import { EntityGetResult, Client, PerspectiveGetResult } from './evees.client';

export class ClientOnMemory implements Client {
  private entities = new Map<string, Entity<any>>();
  private newPerspectives = new Map<string, NewPerspectiveData>();
  private updates = new Map<string, UpdateRequest>();
  private canUpdates = new Map<string, boolean>();

  constructor(protected base: Client, protected store: CASStore) {}

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
  storeEntities(entities: any[]) {
    entities.forEach((entity) => {
      this.entities.set(entity.id, entity);
    });
  }
  async flush(): Promise<void> {
    await this.base.storeEntities(Array.from(this.entities.values()));
    await this.base.createPerspectives(Array.from(this.newPerspectives.values()));
    await this.base.updatePerspectives(Array.from(this.updates.values()));

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

  getEntities(hashes: string[]): Promise<EntityGetResult> {
    return this.store.get(hashes);
  }
  getEntity(uref: string): Promise<Entity<any> | undefined> {
    const { result: entities } = this.store.get([uref]);
    return entities.length === 1 ? entities[0] : undefined;
  }
}
