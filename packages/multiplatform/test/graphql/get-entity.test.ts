import { ApolloClient } from 'apollo-boost';
import gql from 'graphql-tag';
import { expect } from '@open-wc/testing';

import { CortexModule } from '@uprtcl/cortex';
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { DiscoveryModule } from '../../src/discovery.module';
import { MockModule } from '../mocks/mock.module';

const object1 = {
  test: 'test'
};

describe('basic GraphQl entity', () => {
  let orchestrator: MicroOrchestrator;

  beforeEach(async () => {
    orchestrator = new MicroOrchestrator();

    await orchestrator.loadModules([
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule(),
      new MockModule({ hash1: { id: 'hash1', object: object1 } })
    ]);
  });

  it('graphql loads an entity given its id', async () => {
    const client: ApolloClient<any> = orchestrator.container.get(
      ApolloClientModule.bindings.Client
    );

    const result = await client.query({
      query: gql`
        {
          entity(id: "hash1") {
            id
            _context {
              raw
            }
          }
        }
      `
    });

    expect(result.data).to.deep.equal({
      entity: {
        id: 'hash1',
        __typename: 'Mock',
        _context: { raw: '{"test":"test"}', __typename: 'EntityContext' }
      }
    });
  });
});
