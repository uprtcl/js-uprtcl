import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const documentsTypeDefs: DocumentNode = gql`
  type StringField {
    id: String
    value: String
  }

  type IntField {
    id: string
    value: Int
  }

  type FloatField {
    id: String
    value: Float
  }

  union NodeFiled = StringField | IntField | FloatField

  type TextNodeFields implements Entity {
    id: ID!

    text: String!
    type: TextType
    links: [Entity]! @discover
    fields: [NodeFiled]!

    _context: EntityContext!
  }

  input TextNodeFieldsInput {
    text: String!
    type: TextType!
    links: [String!]!
    fields: [NodeFiled]!
  }

  extend type Mutation {
    createTextNodeFields(content: TextNodeFieldInput!, source: ID): TextNodeFields!
  }
`;