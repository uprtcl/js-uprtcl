import { gql } from 'apollo-boost';

export const CREATE_WIKI = gql`
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
