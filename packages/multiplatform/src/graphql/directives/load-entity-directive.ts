import { GraphQLField } from 'graphql';
import { interfaces } from 'inversify';
import { ApolloCache } from 'apollo-cache';

import { Hashed } from '@uprtcl/cortex';
import { NamedDirective } from '@uprtcl/graphql';

import { Source } from '../../types/source';
import gql from 'graphql-tag';
import { MultiplatformBindings } from 'src/bindings';
import { EntityCache } from '../entity-cache';

export abstract class LoadEntityDirective extends NamedDirective {
  protected abstract getSource(container: interfaces.Container): Source;

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

      const source = this.getSource(context.container);
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
    source: Source
  ): Promise<Hashed<any> | undefined> {
    const cachedEntity = entityCache.getCachedEntity(entityId);

    if (cachedEntity) return cachedEntity;

    const entity: Hashed<any> | undefined = await source.get(entityId);

    if (!entity) throw new Error(`Could not find entity with id ${entityId}`);

    entityCache.cacheEntity(entityId, entity);

    return { id: entityId, ...entity.object };
  }
}
