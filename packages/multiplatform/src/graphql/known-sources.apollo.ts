import { injectable, inject } from 'inversify';
import { ApolloClient, gql } from 'apollo-boost';

import { ApolloClientModule } from '@uprtcl/graphql';

import { KnownSourcesService } from '../references/known-sources/known-sources.service';

@injectable()
export class KnownSourcesApollo implements KnownSourcesService {
  constructor(@inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>) {}

  async ready(): Promise<void> {}

  async getKnownSources(hash: string): Promise<string[] | undefined> {
    try {
      const result: any = this.client.readQuery({
        query: gql`
        {
          entity(ref: "${hash}") {
            id
            _context {
              casID
            }
          }
        }
        `
      });
      return [result.entity._context.casID];
    } catch (e) {
      return undefined;
    }
  }

  async addKnownSources(hash: string, sources: string[], typename?: string): Promise<void> {
    const entity = {
      data: {
        entity: {
          id: hash,
          _context: {
            __typename: 'EntityContext',
            casID: sources[0]
          }
        }
      }
    };
    if (typename) {
      entity.data.entity['__typename'] = typename;
    }
    this.client.writeData(entity);
  }

  removeKnownSource(hash: string, casID: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
