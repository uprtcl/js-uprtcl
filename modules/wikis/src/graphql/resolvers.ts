import { WikisProvider } from '../services/wikis.provider';
import { WikiBindings } from '../bindings';

export const resolvers = {
  Mutation: {
    async createWiki(_, { content, source }, { container }) {
      const wikisProviders: WikisProvider[] = container.getAll(WikiBindings.WikisRemote);

      const remote = wikisProviders.find(d => d.source === source);

      if (!remote) throw new Error(`No wikis provider registered for source ${source}`);

      const id = await remote.createWiki(content);

      return { id, ...content };
    }
  }
};
