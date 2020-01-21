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
    try {
      const result: any = this.client.readQuery({
        query: gql`
        {
          entity(id: "${hash}") {
            _context {
              source
            }
          }
        }
        `
      });
      return [result.entity._context.source];
    } catch (e) {
      return undefined;
    }
  }

  async addKnownSources(hash: string, sources: string[]): Promise<void> {
    this.client.writeData({
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
  }

  removeKnownSource(hash: string, source: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
