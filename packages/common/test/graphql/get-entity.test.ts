import { ApolloClient, gql } from 'apollo-boost';

import { CortexModule } from '@uprtcl/cortex';
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';

import { MockSource } from '../mocks/mock.source';
import { ApolloClientModule } from '../../src/uprtcl-common';
import { DiscoveryModule } from '@uprtcl/multiplatform';

const object1 = {
  test: 'test'
};

describe('basic GraphQl entity', () => {
  let orchestrator: MicroOrchestrator;
  let source: MockSource;

  beforeEach(async () => {
    source = new MockSource();
    source.addObject('hash1', object1);

    orchestrator = new MicroOrchestrator();
    orchestrator.container.bind(DiscoveryBindings.Source).toConstantValue(source);

    await orchestrator.loadModules([
      new CortexModule(),
      new DiscoveryModule(),
      new ApolloClientModule()
    ]);
  });

  it('graphql loads and entity given its id', async () => {
    /*     const client: ApolloClient<any> = orchestrator.container.get(GraphQlBindings.Client);

    const result = await client.query({
      query: gql`
        {
          entity(id: "hash1") {
            id
            raw
          }
        }
      `
    });

    console.log(result);
 */
  });
});
