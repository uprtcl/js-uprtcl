import { Wikis } from '../services/wikis';
import { WikiBindings } from '../bindings';

export const resolvers = {
    Mutation: {
      async createWiki(_, { content, usl }, { container }) {
        const wikis: Wikis = container.get(WikiBindings.Wikis);
        const { id, object } = await wikis.createWiki(content, usl);
  
        return { id, ...object };
      }
    }
  };