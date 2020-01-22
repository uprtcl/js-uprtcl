export const ApolloClientBindings = {
  Client: Symbol('apollo-client'),
  RootSchema: Symbol('apollo-root-schema')
};

export const GraphQlSchemaBindings = {
  TypeDefs: Symbol('graphql-type-defs'),
  Resolvers: Symbol('graphql-resolvers'),
  Directive: Symbol('graphql-directives')
};
