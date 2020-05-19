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
  QmRATqNEt2JmTmy4VrmFhYVxNZEPrQEb1gzeBvsokftXqo: {
    test: 'test',
    data: 'QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK',
  },
  QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK: {
    test: 'test2',
    data: undefined,
  },
};

describe('basic GraphQl entity', () => {
  let orchestrator: MicroOrchestrator = new MicroOrchestrator();

  before(async () => {
    await orchestrator.loadModules([
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule(),
      new MockModule(objects),
    ]);
  });

  it('graphql loads an entity given its id and recognizes its patterns', async () => {
    const client: ApolloClient<any> = orchestrator.container.get(
      ApolloClientModule.bindings.Client
    );

    let result = await client.query({
      query: gql`
        {
          entity(ref: "QmRATqNEt2JmTmy4VrmFhYVxNZEPrQEb1gzeBvsokftXqo") {
            id
            ... on Mock {
              test
            }
            _context {
              casID
              object
              patterns {
                __typename
                text
              }
            }
          }
        }
      `,
    });

    expect(result.data).to.deep.equal({
      entity: {
        id: 'QmRATqNEt2JmTmy4VrmFhYVxNZEPrQEb1gzeBvsokftXqo',
        __typename: 'Mock',
        test: 'test',
        _context: {
          casID: 'local',
          object: objects['QmRATqNEt2JmTmy4VrmFhYVxNZEPrQEb1gzeBvsokftXqo'],
          __typename: 'EntityContext',
          patterns: {
            __typename: 'Patterns',
            text: 'test',
          },
        },
      },
    });

    result = await client.query({
      query: gql`
        {
          entity(ref: "QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK") {
            __typename
            id
            _context {
              __typename
              casID
              object
              patterns {
                text
              }
            }
          }
        }
      `,
    });

    expect(result.data).to.deep.equal({
      entity: {
        id: 'QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK',
        __typename: 'Mock',
        _context: {
          casID: 'local',
          object: objects['QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK'],
          __typename: 'EntityContext',
          patterns: {
            __typename: 'Patterns',
            text: 'test2',
          },
        },
      },
    });
  });

  it('graphql loads the content of the entity directly through redirects', async () => {
    const client: ApolloClient<any> = orchestrator.container.get(
      ApolloClientModule.bindings.Client
    );

    let result = await client.query({
      query: gql`
        {
          entity(ref: "QmRATqNEt2JmTmy4VrmFhYVxNZEPrQEb1gzeBvsokftXqo") {
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
      `,
    });

    expect(result.data).to.deep.equal({
      entity: {
        id: 'QmRATqNEt2JmTmy4VrmFhYVxNZEPrQEb1gzeBvsokftXqo',
        __typename: 'Mock',
        _context: {
          __typename: 'EntityContext',
          content: {
            __typename: 'Mock',
            id: 'QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK',
            _context: {
              __typename: 'EntityContext',
              patterns: {
                __typename: 'Patterns',
                text: 'test2',
              },
            },
          },
        },
      },
    });

    result = await client.query({
      query: gql`
        {
          entity(ref: "QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK") {
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
      `,
    });

    expect(result.data).to.deep.equal({
      entity: {
        id: 'QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK',
        __typename: 'Mock',
        _context: {
          __typename: 'EntityContext',
          content: {
            __typename: 'Mock',
            id: 'QmbN42sxsBz59gD5eLfaFkehZbBDUTYYcu6PMHZUhRgCZK',
            _context: {
              __typename: 'EntityContext',
              patterns: {
                __typename: 'Patterns',
                text: 'test2',
              },
            },
          },
        },
      },
    });
  });
});
