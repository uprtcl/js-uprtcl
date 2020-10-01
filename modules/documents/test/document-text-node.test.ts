import { html, fixture, expect } from '@open-wc/testing';
import { waitUntil } from '@open-wc/testing-helpers';

import { ApolloClientModule } from '@uprtcl/graphql';
import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';
import { DiscoveryModule } from '@uprtcl/multiplatform';
import { LensesModule } from '@uprtcl/lenses';
import { EveesModule } from '@uprtcl/evees';

import { DocumentsModule } from '../src/documents.module';
import { MockStore } from './mocks/mock-store';
import { TextType } from '../src/types';
import { MockEveesProvider } from './mocks/mock-evees-provider';

describe('<cortex-entity>', () => {
  let orchestrator: MicroOrchestrator;
  let documentsProvider = new MockStore({
    QmWMjMi7WHGVyup7aQeyeoExRwGd3vSTkSodRh2afVRxiN: {
      text: 'node1 content',
      type: TextType.Paragraph,
      links: []
    }
  });
  let eveesProvider = new MockEveesProvider(
    {
      Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw: {
        payload: {
          remote: 'local',
          creatorId: 'user1',
          timestamp: 0
        },
        proof: { signature: '', type: '' }
      },
      QmW7kKc1QxkzBfsod9M3bZFeHjQGyiR8d434dqkzfjBuTN: {
        payload: {
          creatorsIds: ['user1'],
          timestamp: 0,
          message: 'commit message',
          parentsIds: [],
          dataId: 'QmWMjMi7WHGVyup7aQeyeoExRwGd3vSTkSodRh2afVRxiN'
        },
        proof: {
          signature: '',
          type: ''
        }
      }
    },
    {
      Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw: {
        headId: 'QmW7kKc1QxkzBfsod9M3bZFeHjQGyiR8d434dqkzfjBuTN'
      }
    }
  );

  beforeEach(async () => {
    orchestrator = new MicroOrchestrator();

    await orchestrator.loadModules([
      new i18nextBaseModule(),
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule(),
      new LensesModule(),
      new EveesModule([eveesProvider]),
      new DocumentsModule([documentsProvider])
    ]);
  });

  it('<cortex-entity> with a perspective to a node renders a <documents-text-node>', async () => {
    const el: HTMLElement = await fixture(
      html`
        <module-container
          ><cortex-entity uref="Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw"></cortex-entity
        ></module-container>
      `
    );

    const cortexEntity = el.firstElementChild as HTMLElement;

    expect(el).lightDom.to.equal(
      '<cortex-entity uref="Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw"></cortex-entity>'
    );
    expect(cortexEntity).shadowDom.to.equal('<uprtcl-loading></uprtcl-loading>');

    await waitUntil(
      () => !(cortexEntity.shadowRoot as ShadowRoot).querySelector('uprtcl-loading'),
      'Never stopped loading'
    );

    expect(cortexEntity).shadowDom.to.equal(
      '<documents-text-node uref="Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw"></documents-text-node'
    );
  });
});
