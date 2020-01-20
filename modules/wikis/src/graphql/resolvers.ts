import { Pattern, Creatable } from '@uprtcl/cortex';

import { WikiBindings } from '../bindings';

export const resolvers = {
  Mutation: {
    async createWiki(_, { content, source }, { container }) {
      const patterns: Pattern[] = container.getAll(WikiBindings.WikiEntity);

      const creatable: Creatable<any> | undefined = (patterns.find(
        p => ((p as unknown) as Creatable<any>).create
      ) as unknown) as Creatable<any>;

      if (!creatable) throw new Error(`No creatable pattern for WikiEntity is registered`);

      const id = await creatable.create()(content, source);

      return { id, ...content };
    }
  }
};
