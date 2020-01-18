import { DocumentsProvider } from '../services/documents.provider';

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, source }, { container }) {
      const documents: DocumentsProvider = container.get(source);

      const id = await documents.createTextNode(content);
      return { id: id, ...content };
    }
  }
};
