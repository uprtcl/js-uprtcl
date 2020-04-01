import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const CREATE_TEXT_FIELDS_NODE: DocumentNode = gql`
  mutation CreateTextNodeFields($content: TextNodeFieldsInput!, $source: ID) {
    createTextNodeFields(content: $content, source: $source) {
      id
    }
  }
`;
