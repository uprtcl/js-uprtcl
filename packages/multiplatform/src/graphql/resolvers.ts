import { PatternRecognizer, CortexModule } from '@uprtcl/cortex';

import { DiscoveryService } from '../services/discovery.service';
import { DiscoveryModule } from '../discovery.module';
import { getIsomorphisms, entityContent } from '../utils/entities';

export const discoverResolvers = {
  Patterns: {
    async content(parent, args, { container }, info) {
      const entity = parent.__entity;

      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);
      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);

      return entityContent(entity, recognizer, discovery);
    },
    async isomorphisms(parent, args, { container }, info) {
      const entity = parent.__entity;

      const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);

      const discovery: DiscoveryService = container.get(DiscoveryModule.bindings.DiscoveryService);

      const isomorphisms = await getIsomorphisms(recognizer, entity, (id: string) =>
        discovery.get(id)
      );

      return isomorphisms;
    }
  }
};
