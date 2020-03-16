import { Store, StoresModule } from '@uprtcl/multiplatform';

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, source }, { container }) {
      const stores: Store[] = container.getAll(StoresModule.bindings.Store);

      const store = stores.find(d => d.source === source);

      if (!store) throw new Error(`No store registered for source ${source}`);

      const id = await store.put(content);

      return { id, ...content };
    }
  }
};
