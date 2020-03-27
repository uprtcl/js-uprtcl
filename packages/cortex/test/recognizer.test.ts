import { CortexModule, PatternRecognizer } from '../src/uprtcl-cortex';
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';

import { MockModule } from './mocks/mock.module';
import { expect } from '@open-wc/testing';

const object1 = {
  test: 'test'
};

describe('basic pattern recognition', () => {
  let orchestrator: MicroOrchestrator;

  beforeEach(async () => {
    orchestrator = new MicroOrchestrator();

    await orchestrator.loadModules([
      new ApolloClientModule(),
      new CortexModule(),
      new MockModule({ hash1: object1 })
    ]);
  });

  it('graphql loads an entity given its id', async () => {
    const recognizer: PatternRecognizer = orchestrator.container.get(
      CortexModule.bindings.Recognizer
    );

    const properties = recognizer.recognize(object1);

    expect(properties.length).to.equal(1);
    expect(properties[0].behaviours.length).to.equal(1);
  });
});
