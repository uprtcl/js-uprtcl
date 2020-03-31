import { html, fixture, expect } from '@open-wc/testing';
import { waitUntil } from '@open-wc/testing-helpers';

import { ApolloClientModule } from '@uprtcl/graphql';
import { MicroOrchestrator } from '@uprtcl/micro-orchestrator';
import { CortexModule } from '@uprtcl/cortex';
import { DiscoveryModule } from '@uprtcl/multiplatform';
import { LensesModule } from '@uprtcl/lenses';
import { EveesModule } from '@uprtcl/evees';

import { DocumentsModule } from '../src/documents.module';
import { MockDocumentsProvider } from './mocks/mock-documents-provider';
import { TextType } from '../src/types';
import { MockEveesProvider } from './mocks/mock-evees-provider';

describe('<cortex-entity>', () => {
  let orchestrator: MicroOrchestrator;
  let documentsProvider = new MockDocumentsProvider({
    node1: {
      id: 'node1',
      object: {
        text: 'node1 content',
        type: TextType.Paragraph,
        links: []
      }
    }
  });
  let eveesProvider = new MockEveesProvider(
    {
      perspective1: {
        id: 'perspective1',
        object: {
          payload: {
            origin: 'local',
            creatorId: 'user1',
            timestamp: 0
          },
          proof: { signature: '', type: '' }
        }
      },
      commit1: {
        id: 'commit1',
        object: {
          payload: {
            creatorsIds: ['user1'],
            timestamp: 0,
            message: 'commit message',
            parentsIds: [],
            dataId: 'node1'
          },
          proof: {
            signature: '',
            type: ''
          }
        }
      }
    },
    { perspective1: { headId: 'commit1' } }
  );

  beforeEach(async () => {
    orchestrator = new MicroOrchestrator();

    const remoteMap = (eveesAuthority, entityName) => documentsProvider;
    const remotesConfig = {
      map: remoteMap,
      defaultCreator: eveesProvider
    };

    await orchestrator.loadModules([
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule(),
      new LensesModule(),
      new EveesModule([eveesProvider], remotesConfig),
      new DocumentsModule([documentsProvider])
    ]);
  });

  it('<cortex-entity> with a perspective to a node renders a <documents-text-node>', async () => {
    const el: HTMLElement = await fixture(
      html`
        <module-container><cortex-entity link="perspective1"></cortex-entity></module-container>
      `
    );

    const cortexEntity = el.firstElementChild;

    expect(el).lightDom.to.equal('<cortex-entity link="perspective1"></cortex-entity>');
    expect(cortexEntity).shadowDom.to.equal(
      '<cortex-loading-placeholder></cortex-loading-placeholder>'
    );

    await waitUntil(
      () =>
        cortexEntity &&
        cortexEntity.shadowRoot &&
        !cortexEntity.shadowRoot.querySelector('cortex-loading-placeholder'),
      'Never stopped loading'
    );

    expect(cortexEntity).shadowDom.to.equal('<documents-text-node></documents-text-node');

    expect(true).to.be.ok;
  });
});
