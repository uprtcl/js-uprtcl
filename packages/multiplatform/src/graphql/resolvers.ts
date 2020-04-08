import { CortexModule, Entity, entityFromGraphQlObject } from '@uprtcl/cortex';
import { redirectEntity } from 'src/utils/entities';
import { ApolloClient, gql } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryBindings } from 'src/bindings';
import { EntityCache } from './entity-cache';

export const resolvers = {
  EntityContext: {
    casID(parent, _, { container }) {
      const entity = entityFromGraphQlObject(parent);
      const cache: EntityCache = container.get(DiscoveryBindings.EntityCache);

      const cachedEntity = cache.getCachedEntity(entity.id);

      if (!cachedEntity) throw new Error(`Entity with id ${entity.id} was not found in cache`);

      return cachedEntity.casID;
    },
    async content(parent, _, { container }) {
      const entityId = parent.id;
      const recognizer = container.get(CortexModule.bindings.Recognizer);
      const client = container.get(ApolloClientModule.bindings.Client);

      const redirectedEntity = await redirectEntity(recognizer, ref => loadEntity(client)(ref))(
        entityId
      );
      return { id: redirectedEntity.id, ...redirectedEntity.entity };
    }
  }
};

export const loadEntity = (apolloClient: ApolloClient<any>) => async (
  entityRef: string
): Promise<Entity<any> | undefined> => {
  const result = await apolloClient.query({
    query: gql`
    {
      entity(ref: "${entityRef}") {
        id
        
        _context {
          object
          casID
        }
      }
    }
    `
  });

  if (!result.data.entity) return undefined;

  const entity = result.data.entity._context.object;

  return {
    id: result.data.entity.id,
    entity: entity,
    casID: result.data.entity._context.casID
  };
};
