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

    const result: any = this.client.readQuery({
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
    console.log('HSAH', hash, sources);

    const result: any = this.client.writeQuery({
      query: gql`
      {
        entity(id: "${hash}") {
          id
          _context {
            source
          }
        }
      }
      `,
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
    console.log('as');

    const result2: any = this.client.readQuery({
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

    console.log(result2);
  }

  removeKnownSource(hash: string, source: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
