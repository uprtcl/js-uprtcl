import { WikisProvider } from '../services/wikis.provider';

export const resolvers = {
  Mutation: {
    async createWiki(_, { content, source }, { container }) {
      const wikis: WikisProvider = container.get(source);
      const id = await wikis.createWiki(content);

      return { id, ...content };
    }
  }
};
