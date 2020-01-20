import { injectable, inject } from 'inversify';
import { ApolloClient, gql } from 'apollo-boost';

import { KnownSourcesService } from '@uprtcl/multiplatform';

import { ApolloClientBindings } from '../graphql/bindings';

@injectable()
export class KnownSourcesApollo implements KnownSourcesService {
  constructor(@inject(ApolloClientBindings.Client) protected client: ApolloClient<any>) {}

  async ready(): Promise<void> {}

  async getKnownSources(hash: string): Promise<string[] | undefined> {
    debugger;

    const result: any = await this.client.cache.readQuery({
      query: gql`
        {
            entity(id: "${hash}") {
                id
                _context {
                    source
                }
            }
        }
        `
    });
    return result.data.entity._context.source;
  }

  async addKnownSources(hash: string, sources: string[]): Promise<void> {
    const result: any = await this.client.cache.writeData({
      data: {
        Entity: {
          id: hash,
          _context: {
            source: sources[0]
          }
        }
      }
    });
    debugger;
  }
  
  removeKnownSource(hash: string, source: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
