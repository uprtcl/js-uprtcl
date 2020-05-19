import { injectable, inject } from 'inversify';
import { ApolloClient, gql } from 'apollo-boost';

import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternRecognizer, Entity } from '@uprtcl/cortex';
import { Dictionary } from '@uprtcl/micro-orchestrator';

@injectable()
export class EntityCache {
  pendingLoads: Dictionary<Promise<any> | undefined> = {};

  constructor(
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer
  ) {}

  getCachedEntity(entityId: string): Entity<any> | undefined {
    try {
      const data = this.client.cache['data'].data;
      const cachedObject = data[`$${entityId}._context`];

      if (!cachedObject || !cachedObject.object) return undefined;

      const object = cachedObject.object.json;
      return { id: entityId, object, casID: cachedObject.casID };
    } catch (e) {
      return undefined;
    }
  }

  cacheEntity(entity: Entity<any>): void {
    const type = this.recognizer.recognizeType(entity);

    this.client.writeQuery({
      query: gql`{
        entity(ref: "${entity.id}") {
          __typename
          id
          _context {
            object
            casID
          }
        }
      }`,

      data: {
        entity: {
          __typename: type,
          id: entity.id,
          _context: {
            __typename: 'EntityContext',
            object: entity.object,
            casID: entity.casID,
          },
        },
      },
    });
  }
}
