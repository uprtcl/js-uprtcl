import { GraphQLSchema } from 'graphql';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { VisitableSchemaType } from 'graphql-tools/dist/schemaVisitor';

export abstract class NamedDirective extends SchemaDirectiveVisitor {
  constructor(config: {
    name: string;
    args: {
      [name: string]: any;
    };
    visitedType: VisitableSchemaType;
    schema: GraphQLSchema;
    context: {
      [key: string]: any;
    };
  }) {
    super(config);
  }

  static get directive(): string {
    throw new Error('Method not implemented, meant to be overriden');
  }
}
