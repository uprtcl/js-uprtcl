import { expect } from '@open-wc/testing';

import {
  MicroOrchestrator,
  i18nextBaseModule,
} from '@uprtcl/micro-orchestrator';
import { CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { DiscoveryModule } from '@uprtcl/multiplatform';
import { LensesModule } from '@uprtcl/lenses';

import { MockEveesProvider } from './mocks/mock-evees-provider';
import { MockStore } from './mocks/mock-store';

import { EveesModule } from '../src/evees.module';
import { EveesWorkspace } from '../src/uprtcl-evees';

describe('evees-workspace', () => {
  let orchestrator: MicroOrchestrator;
  let documentsProvider = new MockStore({
    QmWMjMi7WHGVyup7aQeyeoExRwGd3vSTkSodRh2afVRxiN: {
      text: 'node1 content',
      links: [],
    },
  });
  let eveesProvider = new MockEveesProvider(
    {
      Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw: {
        payload: {
          remote: 'local',
          creatorId: 'user1',
          timestamp: 0,
        },
        proof: { signature: '', type: '' },
      },
      QmW7kKc1QxkzBfsod9M3bZFeHjQGyiR8d434dqkzfjBuTN: {
        payload: {
          creatorsIds: ['user1'],
          timestamp: 0,
          message: 'commit message',
          parentsIds: [],
          dataId: 'QmWMjMi7WHGVyup7aQeyeoExRwGd3vSTkSodRh2afVRxiN',
        },
        proof: {
          signature: '',
          type: '',
        },
      },
    },
    {
      Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw: {
        headId: 'QmW7kKc1QxkzBfsod9M3bZFeHjQGyiR8d434dqkzfjBuTN',
      },
    }
  );

  beforeEach(async () => {
    orchestrator = new MicroOrchestrator();

    await orchestrator.loadModules([
      new i18nextBaseModule(),
      new EveesClientModule(),
      new CortexModule(),
      new DiscoveryModule(),
      new LensesModule(),
      new EveesModule([eveesProvider]),
    ]);
  });
  it('evees-workspace works', async () => {
    const client: EveesClient = orchestrator.container.get(
      EveesClientModule.bindings.Client
    );
    const recognizer: PatternRecognizer = orchestrator.container.get(
      CortexModule.bindings.Recognizer
    );

    const workspace = new EveesWorkspace(client, recognizer);
    const result = await workspace.workspace.query({
      query: gql`
        {
          entity(uref: "Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw") {
            id
            _context {
              object
            }
          }
        }
      `,
    });

    expect(result.data).to.deep.eq({
      entity: {
        __typename: 'Perspective',
        _context: {
          __typename: 'EntityContext',
          object: {
            payload: {
              remote: 'local',
              creatorId: 'user1',
              timestamp: 0,
            },
            proof: {
              signature: '',
              type: '',
            },
          },
        },
        id: 'Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw',
      },
    });
  });
});
