import { DocumentsBindings } from '../bindings';

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, source }, { container }) {
      const stores: Store[] = container.getAll(DocumentsBindings.DocumentsRemote);

      const store = stores.find(d => d.source === source);

      if (!store) throw new Error(`No store registered for source ${source}`);

      const id = await store.put(content);

      return { id, ...content };
    }
  }
};
