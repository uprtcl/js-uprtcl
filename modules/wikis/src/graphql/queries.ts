import gql from 'graphql-tag';

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
