import { GraphQLField } from 'graphql';
import { interfaces } from 'inversify';
import { ApolloCache } from 'apollo-cache';

import { Hashed } from '@uprtcl/cortex';
import { NamedDirective } from '@uprtcl/graphql';

import { Source } from '../../types/source';
import gql from 'graphql-tag';

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

      if (typeof entityId === 'string') return this.loadEntity(entityId, context.cache, source);
      else if (Array.isArray(entityId)) {
        return entityId.map(id => this.loadEntity(id, context.cache, source));
      }
    };
  }

  protected async loadEntity(
    entityId: string,
    cache: ApolloCache<any>,
    source: Source
  ): Promise<Hashed<any> | undefined> {
    try {
      const data = cache['data'].data;
      const cachedObject = data[`$${entityId}._context`];

      const object = JSON.parse(cachedObject.raw);
      return { id: entityId, ...object };
    } catch (e) {
    }

    const entity: Hashed<any> | undefined = await source.get(entityId);

    if (!entity) throw new Error(`Could not find entity with id ${entityId}`);


    cache.writeData({
      data: {
        entity: {
          id: entityId,
          _context: {
            __typename: 'EntityContext',
            raw: JSON.stringify(entity.object)
          }
        }
      }
    });

    return { id: entityId, ...entity.object };
  }
}
