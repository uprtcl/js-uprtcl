import { html, fixture, expect } from '@open-wc/testing';
import { MicroOrchestrator } from '../src/orchestrator/micro-orchestrator';
import { MockModule } from './mocks/mock.module';

describe('load a mock module', () => {
  let orchestrator: MicroOrchestrator = undefined;

  beforeEach(() => {
    orchestrator = new MicroOrchestrator();
  });

  it('has a default property title', async () => {
    await orchestrator.loadModule(new MockModule());

    expect(orchestrator.container.get('mock-id')).equal(5);
  });
});
