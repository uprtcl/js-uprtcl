import { contentCreateResolver } from '@uprtcl/evees';

export const resolvers = {
  Mutation: {
    async createTextNode(_, { content, source }, { container }) {
      return contentCreateResolver(content, source, container)
    }
  }
};
