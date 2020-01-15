import { Documents } from '../services/documents';
import { DocumentsBindings } from 'src/bindings';

import { Logger } from '@uprtcl/micro-orchestrator';

const logger = new Logger('DOCUMENT-TEXT-NODE-SCHEMA');

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, usl }, { container }) {
      logger.info('createTextNode()', { content, usl });

      const documents: Documents = container.get(DocumentsBindings.Documents);

      const textNode = await documents.createTextNode(content, usl);
      return { id: textNode.id, ...textNode.object };
    }
  }
};
