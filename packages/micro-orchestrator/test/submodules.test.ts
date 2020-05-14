import { html, fixture, expect } from '@open-wc/testing';
import { MicroOrchestrator } from '../src/orchestrator/micro-orchestrator';
import { MockModule } from './mocks/mock.module';
import { AggregatorModule } from './mocks/aggregator-module';

describe('load a mock module', () => {
  let orchestrator: MicroOrchestrator;

  it('submodules depending on each other loads fine', async () => {
    orchestrator = new MicroOrchestrator();
    await orchestrator.loadModule(new AggregatorModule());

    expect(orchestrator.container.get(MockModule.bindings.Mock)).to.equal(5);
  });
});
