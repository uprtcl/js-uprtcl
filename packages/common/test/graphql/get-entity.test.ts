import { ApolloClient, gql } from 'apollo-boost';

import { DiscoveryTypes, CortexTypes, PatternsModule, discoveryModule, CortexModule } from '@uprtcl/cortex';
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';

import { MockSource } from '../mocks/mock.source';
import { GraphQlTypes, ApolloClientModule } from '../../src/uprtcl-common';

const object1 = {
  test: 'test'
};

describe('basic GraphQl getEntity', () => {
  let orchestrator: MicroOrchestrator;
  let source: MockSource;

  beforeEach(async () => {
    source = new MockSource();
    source.addObject('hash1', object1);

    orchestrator = new MicroOrchestrator();
    orchestrator.container.bind(DiscoveryTypes.Source).toConstantValue(source);

    await orchestrator.loadModules({
      [CortexTypes.Module]: CortexModule,
      [DiscoveryTypes.Module]: discoveryModule(),
      [GraphQlTypes.Module]: ApolloClientModule
    });
  });

  it('graphql loads and entity given its id', async () => {
    /*     const client: ApolloClient<any> = orchestrator.container.get(GraphQlTypes.Client);

    const result = await client.query({
      query: gql`
        {
          getEntity(id: "hash1") {
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
