import { injectable, inject } from 'inversify';
import { ApolloClientModule } from '@uprtcl/graphql';
import { ApolloClient } from 'apollo-boost';
import { Hashed } from '@uprtcl/cortex';

@injectable()
export class EntityCache {
  constructor(@inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>) {}

  getCachedEntity(entityId: string): Hashed<any> | undefined {
    try {
      const data = this.client.cache['data'].data;
      const cachedObject = data[`$${entityId}._context`];

      const object = JSON.parse(cachedObject.raw);
      return { id: entityId, ...object };
    } catch (e) {
      return undefined;
    }
  }

  cacheEntity(entityId: string, entity: any): void {
    this.client.cache.writeData({
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
  }
}
