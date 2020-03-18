import { contentCreateResolver } from '@uprtcl/evees';

export const resolvers = {
  Mutation: {
    async createWiki(_, { content, source }, { container }) {
      return contentCreateResolver(content, source, container)
    }
  }
};
