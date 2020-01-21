import { Pattern, Creatable } from '@uprtcl/cortex';

import { DocumentsBindings } from '../bindings';
import { TextNode } from 'src/types';

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, source }, { container }) {
      const patterns: Pattern[] = container.getAll(DocumentsBindings.TextNodeEntity);

      const creatable: Creatable<any, TextNode> | undefined = (patterns.find(
        p => ((p as unknown) as Creatable<any, TextNode>).create
      ) as unknown) as Creatable<any, TextNode>;

      if (!creatable) throw new Error(`No creatable pattern for TextNodeEntity is registered`);

      const hashed = await creatable.create()(content, source);

      return { id: hashed.id, ...hashed.object };
    }
  }
};
