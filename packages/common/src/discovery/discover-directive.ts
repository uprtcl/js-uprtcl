import { SchemaDirectiveVisitor } from 'graphql-tools';
import { GraphQLField } from 'graphql';

import { DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';
import { Hashed } from '@uprtcl/cortex';

export class DiscoverDirective extends SchemaDirectiveVisitor {
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

      const discovery: DiscoveryService = context.container.get(
        DiscoveryModule.bindings.DiscoveryService
      );

      if (typeof entityId === 'string') return loadEntity(entityId, discovery);
      else return entityId.map(id => loadEntity(id, discovery));
    };
  }
}

async function loadEntity(
  entityId: string,
  discoveryService: DiscoveryService
): Promise<Hashed<any> | undefined> {
  const entity: Hashed<any> | undefined = await discoveryService.get(entityId);

  if (!entity) throw new Error(`Could not find entity with id ${entityId}`);
  
  return { id: entityId, ...entity.object };
}
