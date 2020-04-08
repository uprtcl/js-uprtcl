import { CortexModule, Entity } from '@uprtcl/cortex';
import { redirectEntity } from 'src/utils/entities';
import { ApolloClient, gql } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';

export const resolvers = {
  EntityContext: {
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
        __typename
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
