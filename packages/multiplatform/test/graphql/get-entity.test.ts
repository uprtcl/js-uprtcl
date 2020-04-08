import { ApolloClient } from 'apollo-boost';
import gql from 'graphql-tag';
import { expect } from '@open-wc/testing';

import { CortexModule, Entity } from '@uprtcl/cortex';
import { MicroOrchestrator, Dictionary } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { DiscoveryModule } from '../../src/discovery.module';
import { MockModule } from '../mocks/mock.module';
import { MockEntity } from '../mocks/mock.pattern';

const objects: Dictionary<MockEntity> = {
  hash1: {
    test: 'test',
    data: 'hash2'
  },
  hash2: {
    test: 'test2',
    data: undefined
  }
};

describe('basic GraphQl entity', () => {
  let orchestrator: MicroOrchestrator = new MicroOrchestrator();

  before(async () => {
    await orchestrator.loadModules([
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule(),
      new MockModule(objects)
    ]);
  });

  it('graphql loads an entity given its id and recognizes its patterns', async () => {
    const client: ApolloClient<any> = orchestrator.container.get(
      ApolloClientModule.bindings.Client
    );

    let result = await client.query({
      query: gql`
        {
          entity(ref: "hash1") {
            __typename
            id
            _context {
              object
              patterns {
                text
              }
            }
          }
        }
      `
    });

    expect(result.data).to.deep.equal({
      entity: {
        id: 'hash1',
        __typename: 'Mock',
        _context: {
          object: objects['hash1'],
          __typename: 'EntityContext',
          patterns: {
            __typename: 'Patterns',
            text: 'test'
          }
        }
      }
    });
    
    result = await client.query({
      query: gql`
        {
          entity(ref: "hash2") {
            __typename
            id
            _context {
              object
              patterns {
                text
              }
            }
          }
        }
      `
    });

    expect(result.data).to.deep.equal({
      entity: {
        id: 'hash2',
        __typename: 'Mock',
        _context: {
          object: objects['hash2'],
          __typename: 'EntityContext',
          patterns: {
            __typename: 'Patterns',
            text: 'test2'
          }
        }
      }
    });
  });

  it('graphql loads the content of the entity directly through redirects', async () => {
    const client: ApolloClient<any> = orchestrator.container.get(
      ApolloClientModule.bindings.Client
    );

    const result = await client.query({
      query: gql`
        {
          entity(ref: "hash1") {
            __typename
            id
            _context {
              content {
                id
                _context {
                  patterns {
                    text
                  }
                }
              }
            }
          }
        }
      `
    });

    expect(result.data).to.deep.equal({
      entity: {
        id: 'hash1',
        __typename: 'Mock',
        _context: {
          __typename: 'EntityContext',
          content: {
            __typename: 'Mock',
            id: 'hash2',
            _context: {
              __typename: 'EntityContext',
              patterns: {
                __typename: 'Patterns',
                text: 'test2' 
              }
            }
          }
        }
      }
    });
  });
});
