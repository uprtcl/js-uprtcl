export const AccessControlTypes = {
  OwnerPattern: Symbol('owner-pattern'),
  Module: Symbol('owner-module')
};

export const DraftsTypes = {
  DraftsProvider: Symbol('drafts-provider')
};

export const GraphQlTypes = {
  Module: Symbol('apollo-client-module'),
  Client: Symbol('apollo-client'),
  RootSchema: Symbol('apollo-root-schema'),
  TypeDefs: Symbol('graphql-type-defs'),
  Resolvers: Symbol('graphql-resolvers'),
  ExecutableSchema: Symbol('graphql-executable-schema')
};
