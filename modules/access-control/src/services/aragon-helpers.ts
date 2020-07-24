import gql from 'graphql-tag';
import { ethers } from 'ethers';
import { GraphQLWrapper } from '@aragon/connect-thegraph';

export async function keepRunning() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000000000);
  });
}

const QUERY_REPO_BY_NAME = gql`
  query RepoData($name: String) {
    repos(where: { name: $name }) {
      id
      name
      lastVersion {
        codeAddress
        artifact
        semanticVersion
      }
    }
  }
`;

export async function fetchRepo(name: string, subgraph: string) {
  // Create the GraphQL wrapper using the specific Subgraph URL
  const wrapper = new GraphQLWrapper(subgraph);

  // Invoke the custom query and receive data
  return wrapper.performQuery(QUERY_REPO_BY_NAME, {
    name,
  });
}

export async function getOrgAddress(
  templateContract: any,
  txHash: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    debugger;
    const events = await templateContract.getPastEvents('SetupDao');
    const event = events.find((e) => e.transactionHash === txHash);
    resolve(event.returnValues.dao);
  });
}
