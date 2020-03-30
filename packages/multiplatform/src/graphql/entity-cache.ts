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

  getCachedEntity(entityId: string): any | undefined {
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

  cacheEntity(entityId: string, entity: Entity<any>): void {
    const patterns = this.recognizer.recognize(entity);
    const typedEntity = patterns.find(p => p.type);

    if (!typedEntity) {
      throw new Error(`No pattern found to recognize entity ${JSON.stringify(entity)}`);
    }

    const name = typedEntity.type;

    this.client.cache.writeQuery({
      query: gql`{
        entity(id: "${entityId}") {
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
            raw: JSON.stringify(entity.entity)
          }
        }
      }
    });
  }
}
