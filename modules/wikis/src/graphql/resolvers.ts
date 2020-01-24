import { Pattern, Creatable } from '@uprtcl/cortex';

import { WikiBindings } from '../bindings';
import { Wiki } from '../types';

export const resolvers = {
  Mutation: {
    async createWiki(_, { content, source }, { container }) {
      const patterns: Pattern[] = container.getAll(WikiBindings.WikiEntity);

      const creatable: Creatable<any, Wiki> | undefined = (patterns.find(
        p => ((p as unknown) as Creatable<any, Wiki>).create
      ) as unknown) as Creatable<any, Wiki>;

      if (!creatable) throw new Error(`No creatable pattern for WikiEntity is registered`);

      const wiki = await creatable.create()(content, source);

      return { id: wiki.id, ...wiki.object };
    }
  }
};
