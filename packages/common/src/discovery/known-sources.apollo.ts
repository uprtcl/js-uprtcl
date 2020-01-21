import { injectable, inject } from 'inversify';
import { ApolloClient, gql } from 'apollo-boost';

import { KnownSourcesService } from '@uprtcl/multiplatform';
import { CortexModule, PatternRecognizer } from '@uprtcl/cortex';

import { ApolloClientBindings } from '../graphql/bindings';

@injectable()
export class KnownSourcesApollo implements KnownSourcesService {
  constructor(
    @inject(ApolloClientBindings.Client) protected client: ApolloClient<any>,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer
  ) {}

  async ready(): Promise<void> {}

  async getKnownSources(hash: string): Promise<string[] | undefined> {
    console.log('HSAH', hash);
    console.log(
      this.client
    ); /* 
    const result: any = this.client.readQuery({
      query: gql`
        {
          entity(id: "${hash}") {
            id
            _context {
              source @client
            }
          }
        }
        `
    });
    return result.data.entity._context.source; */

    return undefined;
  }

  async addKnownSources(hash: string, sources: string[]): Promise<void> {
    console.log('HSAH', hash, sources);
    console.log(this.client);
/*     const result = this.client.readQuery({
      query: gql`
      {
        entity(id: "${hash}") {
          id
        }
      }`
    });
    console.log('HSAH1', result);

 */    /*     const result1 = this.client.writeData({
      data: {
        entity: {
          id: hash,
          _context: {
            __typename: 'EntityContext',
            source: sources[0]
          }
        }
      }
    });
 */ console.log(
      'as'
    );
  }

  removeKnownSource(hash: string, source: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
