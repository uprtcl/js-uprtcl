import { ApolloClient } from 'apollo-boost';
import gql from 'graphql-tag';

import { CortexModule, PatternsModule } from '@uprtcl/cortex';
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { MockSource } from '../mocks/mock.source';
import { DiscoveryModule } from '../../src/discovery.module';
import { SourcesBindings } from '../../src/bindings';

import { Container } from 'inversify';
import { MockPattern } from '../mocks/mock.pattern';
import { MockModule } from '../mocks/mock.module';

const object1 = {
  test: 'test'
};

describe('basic GraphQl entity', () => {
  let orchestrator: MicroOrchestrator;
  let source: MockSource;

  beforeEach(async () => {
    source = new MockSource();
    source.addObject('hash1', object1);

    const container = new Container();
    container.bind(SourcesBindings.Source).to(MockSource);

    orchestrator = new MicroOrchestrator();
    orchestrator.container.bind(SourcesBindings.Source).toConstantValue(source);

    await orchestrator.loadModules([
      new ApolloClientModule(),
      new CortexModule(),
      new MockModule(),
      new DiscoveryModule()
    ]);
  });

  it('graphql loads and entity given its id', async () => {
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

    console.log(result);
  });
});
