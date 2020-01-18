import { Hashed } from '@uprtcl/cortex';
import { DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';

export const baseResolvers = {
  Query: {
    async entity(parent, { id }, { container }, info) {
      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);

      const entity: Hashed<any> | undefined = await discovery.get(id);

      if (!entity) throw new Error('Entity was not found');

      return { id, ...entity.object };
    }
  },
  Entity: {
    id(parent) {
      return parent.id ? parent.id : parent;
    }
  }
};
