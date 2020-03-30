import { GraphQLField } from 'graphql';
import { interfaces } from 'inversify';

import { Entity } from '@uprtcl/cortex';
import { NamedDirective } from '@uprtcl/graphql';

import { CASSource } from '../../types/cas-source';
import { MultiplatformBindings } from '../../bindings';
import { EntityCache } from '../entity-cache';

export abstract class LoadEntityDirective extends NamedDirective {
  protected abstract getCASSource(container: interfaces.Container): CASSource;

  public visitFieldDefinition(field: GraphQLField<any, any>, detail) {
    let defaultResolver = field.resolve;

    field.resolve = async (parent, args, context, info) => {
      let entityId: string | string[] | undefined = args.id;

      if (!entityId) {
        if (!defaultResolver) {
          defaultResolver = parent => parent[field.name];
        }

        entityId = await defaultResolver(parent, args, context, info);
      }

      if (!entityId) return null;

      const source = this.getCASSource(context.container);
      const entityCache: EntityCache = context.container.get(MultiplatformBindings.EntityCache);

      if (typeof entityId === 'string') return this.loadEntity(entityId, entityCache, source);
      else if (Array.isArray(entityId)) {
        return entityId.map(id => this.loadEntity(id, entityCache, source));
      }
    };
  }

  protected async loadEntity(
    entityId: string,
    entityCache: EntityCache,
    source: CASSource
  ): Promise<any | undefined> {
    const cachedEntity = entityCache.getCachedEntity(entityId);

    if (cachedEntity) return cachedEntity;

    if (entityCache.pendingLoads[entityId]) return entityCache.pendingLoads[entityId];

    const promise = async () => {
      const entity: any | undefined = await source.get(entityId);

      if (!entity) throw new Error(`Could not find entity with id ${entityId}`);

      entityCache.cacheEntity(entityId, { id: entityId, entity, casID: source.casID });

      entityCache.pendingLoads[entityId] = undefined;

      return { id: entityId, ...entity };
    };

    entityCache.pendingLoads[entityId] = promise();
    return entityCache.pendingLoads[entityId];
  }
}
