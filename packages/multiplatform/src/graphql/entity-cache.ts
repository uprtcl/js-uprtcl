import { injectable, inject } from 'inversify';
import { ApolloClient, gql } from 'apollo-boost';

import { ApolloClientModule } from '@uprtcl/graphql';
import { Hashed, CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { Dictionary } from '@uprtcl/micro-orchestrator';

@injectable()
export class EntityCache {

  pendingLoads: Dictionary<Promise<any> | undefined> = {}

  constructor(
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer
  ) {}

  getCachedEntity(entityId: string): Hashed<any> | undefined {
    try {
      const data = this.client.cache['data'].data;
      const cachedObject = data[`$${entityId}._context`];

      if (!cachedObject || !cachedObject.raw) return undefined;

      const object = JSON.parse(cachedObject.raw);
      return { id: entityId, ...object };
    } catch (e) {
      return undefined;
    }
  }

  cacheEntity(entity: Hashed<any>): void {
    const patterns = this.recognizer.recognize(entity);
    const name = patterns.find(p => p.name).name;

    this.client.cache.writeQuery({
      query: gql`{
        entity(id: "${entity.id}") {
          id
          _context {
            raw
          }
        }
      }`,

      data: {
        entity: {
          __typename: name,
          id: entity.id,
          _context: {
            __typename: 'EntityContext',
            raw: JSON.stringify(entity.object)
          }
        }
      }
    });
  }

}
