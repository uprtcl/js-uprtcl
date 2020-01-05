import { gql } from 'apollo-boost';

export const CREATE_TEXT_NODE = gql`
  mutation CreateTextNode($content: TextNodeInput!, $usl: ID) {
    createTextNode(content: $content, usl: $usl) {
      id
    }
  }
`;
