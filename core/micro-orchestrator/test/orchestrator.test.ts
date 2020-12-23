import { html, fixture, expect } from '@open-wc/testing';
import { MicroOrchestrator } from '../src/orchestrator/micro-orchestrator';
import { MockModule } from './mocks/mock.module';

describe('load a mock module', () => {
  let orchestrator: MicroOrchestrator;

  before(async () => {
    orchestrator = new MicroOrchestrator();
    await orchestrator.loadModule(new MockModule());
  });

  it('get a dependency defined in MockModule', async () => {
    expect(orchestrator.container.get(MockModule.bindings.Mock)).equal(5);
  });

  it('load an element which requests a dependency', async () => {
    const el: HTMLElement = await fixture(
      html` <module-container><mock-element></mock-element></module-container> `
    );

    const span = el.firstElementChild as HTMLElement;

    expect(span).shadowDom.to.equal('<span>5</span>');
  });
});
