import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const CREATE_TEXT_NODE: DocumentNode = gql`
  mutation CreateTextNode($content: TextNodeInput!, $source: ID) {
    createTextNode(content: $content, source: $source) {
      id
    }
  }
`;
