import { DocumentsProvider } from '../services/documents.provider';
import { DocumentsBindings } from 'src/bindings';

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, source }, { container }) {
      const documents: DocumentsProvider[] = container.getAll(DocumentsBindings.DocumentsRemote);

      const remote = documents.find(d => d.source === source);

      if (!remote) throw new Error(`No documents provider registered for source ${source}`);

      const id = await remote.createTextNode(content);

      return { id, ...content };
    }
  }
};
