import { PatternRecognizer, CortexModule, Hashed } from '@uprtcl/cortex';

import { DiscoveryService } from '../services/discovery.service';
import { DiscoveryModule } from '../discovery.module';
import { getIsomorphisms, entityContent } from '../utils/entities';
import { ApolloClient, gql } from 'apollo-boost';
import { ApolloClientModule } from '@uprtcl/graphql';

export const discoverResolvers = {
  Patterns: {
    async content(parent, args, { container }, info) {
      const entity: Hashed<any> = parent.__entity;

      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);
      const hasRedirect = recognizer.recognize(entity).find(prop => !!prop.redirect);

      if (!hasRedirect) return entity.id;

      const redirectEntityId = await hasRedirect.redirect(entity);
      if (!redirectEntityId) return entity.id;

      const client: ApolloClient<any> = container.get(ApolloClientModule.bindings.Client);

      const result = await client.query({
        query: gql`
        {
          entity(id: "${redirectEntityId}") {
            id
            _context {
              patterns {
                content {
                  id
                }
              }
            }
          }
        }
        `
      });

      return result.data.entity._context.patterns.content.id;
    },
    async isomorphisms(parent, args, { container }, info) {
      const entity = parent.__entity;

      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);

      const client: ApolloClient<any> = container.get(ApolloClientModule.bindings.Client);

      const isomorphisms = await getIsomorphisms(recognizer, entity, (id: string) =>
        loadEntity(id, client)
      );

      return isomorphisms;
    }
  }
};

async function loadEntity(id: string, client: ApolloClient<any>): Promise<Hashed<any> | undefined> {
  const result = await client.query({
    query: gql`{
      entity(id: "${id}") {
        id
        _context {
          raw
        }
      }
    }`
  });

  return { id, object: result.data.entity._context.raw };
}
