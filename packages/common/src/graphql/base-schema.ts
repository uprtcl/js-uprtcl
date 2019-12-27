import { gql } from 'apollo-boost';

import { DiscoveryTypes, DiscoveryService, Hashed } from '@uprtcl/cortex';

export const baseTypeDefs = gql`
  scalar JSON
  scalar Function

  type EmptyEntity {
    _: Boolean
  }

  union EntityType = EmptyEntity

  type Query {
    getEntity(id: ID!): Entity!
  }

  type Mutation {
    _: Boolean
  }

  type Entity {
    id: ID!
    raw: JSON!
    entity: EntityType!
  }
`;

export const baseResolvers = {
  Query: {
    async getEntity(parent, { id }, { cache, container }, info) {
      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      const entity: Hashed<any> | undefined = await discovery.get(id);

      if (!entity) throw new Error('Entity was not found');
      return { id, raw: entity, entity };
    }
  },
  Entity: {
    id(parent) {
      return parent.id ? parent.id : parent;
    },
    async raw(parent, _, { container }) {
      const id = typeof parent === 'string' ? parent : parent.id;

      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      const entity: Hashed<any> | undefined = await discovery.get(id);

      if (!entity) throw new Error('Entity was not found');
      return entity;
    },
    async entity(parent, _, { container }) {
      const id = typeof parent === 'string' ? parent : parent.id;

      const discovery: DiscoveryService = container.get(DiscoveryTypes.DiscoveryService);

      const entity: Hashed<any> | undefined = await discovery.get(id);

      if (!entity) throw new Error('Entity was not found');
      return { __entity: entity, ...entity.object };
    }
  }
};
