import { ApolloClient, gql } from 'apollo-boost';
import { expect } from '@open-wc/testing';

import { MicroOrchestrator, i18nextBaseModule } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { DiscoveryModule } from '@uprtcl/multiplatform';
import { LensesModule } from '@uprtcl/lenses';
import { AccessControlModule } from '@uprtcl/access-control';

import { MockEveesProvider } from './mocks/mock-evees-provider';
import { MockStore } from './mocks/mock-store';

import { EveesModule } from '../src/evees.module';
import { RemoteMap } from '../src/types';
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
          authority: 'local',
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

    const remoteMap: RemoteMap = (eveesAuthority) => documentsProvider;

    await orchestrator.loadModules([
      new i18nextBaseModule(),
      new ApolloClientModule(),
      new CortexModule(),
      new DiscoveryModule(),
      new LensesModule(),
      new AccessControlModule(),
      new EveesModule([eveesProvider], eveesProvider, remoteMap),
    ]);
  });
  it('evees-workspace works', async () => {
    const client: ApolloClient<any> = orchestrator.container.get(
      ApolloClientModule.bindings.Client
    );
    const recognizer: PatternRecognizer = orchestrator.container.get(
      CortexModule.bindings.Recognizer
    );

    const workspace = new EveesWorkspace(client, recognizer);
    const result = await workspace.workspace.query({
      query: gql`
        {
          entity(ref: "Qmb9vRaxHW4J6b685FSLR8Fkc3ew2FVEiyU6DfPqHeR6bw") {
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
              authority: 'local',
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
