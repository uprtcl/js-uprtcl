import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { expect } from '@open-wc/testing';
import { ApolloClientModule } from '@uprtcl/graphql';

import { CortexModule, PatternRecognizer } from '../src/uprtcl-cortex';
import { MockModule } from './mocks/mock.module';

const object1 = {
  test: 'test',
};

describe('basic pattern recognition', () => {
  let orchestrator: MicroOrchestrator;

  beforeEach(async () => {
    orchestrator = new MicroOrchestrator();

    await orchestrator.loadModules([
      new ApolloClientModule(),
      new CortexModule(),
      new MockModule({ hash1: object1 }),
    ]);
  });

  it('pattern recognizer recognizes the patterns of an object', async () => {
    const recognizer: PatternRecognizer = orchestrator.container.get(
      CortexModule.bindings.Recognizer
    );

    const patterns = recognizer.recognize(object1);

    expect(patterns.length).to.equal(1);
    expect(patterns[0].behaviours.length).to.equal(1);

    const behaviours = recognizer.recognizeBehaviours(object1);

    expect(behaviours.length).to.equal(1);
  });
});
