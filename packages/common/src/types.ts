export const AccessControlTypes = {
  Module: Symbol('access-control-module'),
  OwnerPattern: Symbol('owner-pattern')
};

export const AuthTypes = {
  Module: Symbol('auth-module')
};

export const EntitiesTypes = {
  Module: Symbol('entities-reducer-module')
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
