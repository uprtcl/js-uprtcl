import gql from "graphql-tag";


export const GET_ENTITY = gql`
    query GetEntity($hash: string!, $depth: Int = 1) {
        getEntity(hash: $hash, depth: $depth) {
            
        }
    }
`