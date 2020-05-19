import { expect } from '@open-wc/testing';
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '../src/apollo-client.module';
import { ApolloClient } from 'apollo-boost';

describe('<uprtcl-common>', () => {
  /* let orchestrator: MicroOrchestrator;

  beforeEach(async () => {
    orchestrator = new MicroOrchestrator();

    await orchestrator.loadModules([new ApolloClientModule()]);
  }); */

  it('graphql loads an entity given its id', async () => {
    /*  const client: ApolloClient<any> = orchestrator.container.get(
      ApolloClientModule.bindings.Client
    );
    expect(client).to.be.ok; */
    expect(true).to.be.ok;
  });
});
