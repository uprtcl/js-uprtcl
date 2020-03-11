import { html, fixture, expect } from '@open-wc/testing';
import { waitUntil } from '@open-wc/testing-helpers';

import { ApolloClientModule } from '@uprtcl/graphql';
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';
import { DiscoveryModule } from '@uprtcl/multiplatform';

import { LensesModule } from '../src/lenses.module';
import { MockModule } from './mocks/mock.module';

const object1 = {
  test: 'testing'
};

describe('<cortex-entity>', () => {
  let orchestrator: MicroOrchestrator;

  beforeEach(async () => {
    orchestrator = new MicroOrchestrator();

    await orchestrator.loadModules([
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule(),
      new MockModule({ hash1: { id: 'hash1', object: object1 } }),
      new LensesModule({})
    ]);
  });

  it('<cortex-entity> renders a hash with the appropriate lens', async () => {
    const el: HTMLElement = await fixture(
      html`
        <module-container><cortex-entity id="test" hash="hash1"></cortex-entity></module-container>
      `
    );

    const cortexEntity = el.firstElementChild;

    expect(el).lightDom.to.equal('<cortex-entity id="test" hash="hash1"></cortex-entity>');
    expect(cortexEntity).shadowDom.to.equal(
      '<cortex-loading-placeholder></cortex-loading-placeholder>'
    );

    await waitUntil(
      () => !cortexEntity.shadowRoot.querySelector('cortex-loading-placeholder'),
      'Never stopped loading'
    );

    expect(cortexEntity).shadowDom.to.equal(
      '<mock-element></mock-element>'
    );

    const mock = cortexEntity.shadowRoot.firstElementChild;
    expect(mock).shadowDom.to.equal('<span>Mock content: testing</span>')

  });
});
