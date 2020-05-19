import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, Entity, entityFromGraphQlObject } from '@uprtcl/cortex';

import { redirectEntity, loadEntity } from '../utils/entities';
import { DiscoveryBindings } from '../bindings';
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

      const redirectedEntity = await redirectEntity(recognizer, (ref) => loadEntity(client, ref))(
        entityId
      );
      return { id: redirectedEntity.id, ...redirectedEntity.object };
    },
  },
};
