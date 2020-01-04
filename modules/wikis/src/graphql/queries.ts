import { gql } from 'apollo-boost';

export const CREATE_WIKI = gql`
  mutation CreateWiki($content: WikiInput!, $usl: String) {
    createWiki(content: $content, usl: $usl) {
      id
      raw
    }
  }
`;
