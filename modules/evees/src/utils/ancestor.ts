import { ApolloClient, gql } from 'apollo-boost';

export const isAncestorOf = (client: ApolloClient<any>) => async (
  ancestorId: string,
  commitId: string
): Promise<boolean> => {
  if (ancestorId === commitId) return true;

  const result = await client.query({
    query: gql`{
      entity(uref: "${commitId}") {
        id
        ... on Commit {
          parentCommits {
            id
          }
        }
      }
    }`,
  });

  const parentsIds = result.data.entity.parentCommits.map((p) => p.id);

  if (parentsIds.includes(ancestorId)) {
    return true;
  } else {
    /** recursive call */
    for (let ix = 0; ix < parentsIds.length; ix++) {
      if (await isAncestorOf(client)(ancestorId, parentsIds[ix])) {
        return true;
      }
    }
  }

  return false;
};
