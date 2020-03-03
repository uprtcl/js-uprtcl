import gql from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const CREATE_WIKI: DocumentNode = gql`
  mutation CreateWiki($content: WikiInput!, $source: String) {
    createWiki(content: $content, source: $source) {
      id
      title
      pages {
        id
      }
    }
  }
`;
