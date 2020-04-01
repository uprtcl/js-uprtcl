import { contentCreateResolver } from '@uprtcl/evees';

export const resolvers = {
  Mutation: {
    async createTextNodeFields(_, { content, source }, { container }) {
      return contentCreateResolver(content, source, container)
    }
  }
};
