import { ApolloClient, gql } from 'apollo-boost';

import { createEntity, EntityCache } from '@uprtcl/multiplatform';
import { PatternRecognizer, Hashed } from '@uprtcl/cortex';

import { CREATE_COMMIT, CREATE_PERSPECTIVE } from '../graphql/queries';
import {
  UprtclAction,
  CREATE_DATA_ACTION,
  CREATE_COMMIT_ACTION,
  CREATE_AND_INIT_PERSPECTIVE_ACTION,
  UPDATE_HEAD_ACTION
} from '../types';

export function cacheUpdateRequest(
  client: ApolloClient<any>,
  perspectiveId: string,
  headId: string
): void {
  client.cache.writeQuery({
    query: gql`{
      entity(id: "${perspectiveId}") {
        id
        ... on Perspective {
          head {
            id
          }
        }
      }
    }`,
    data: {
      entity: {
        __typename: 'Perspective',
        id: perspectiveId,
        head: {
          __typename: 'Commit',
          id: headId
        }
      }
    }
  });
}

export async function cacheActions(
  actions: UprtclAction[],
  entityCache: EntityCache,
  client: ApolloClient<any>
) {
    const updateCachePromises = actions.map(action => {
    if (action.type === CREATE_AND_INIT_PERSPECTIVE_ACTION && action.entity) {
      const perspectiveId = ((action.entity as unknown) as Hashed<any>).id;
      const headId = action.payload.details.headId;

      const raw = JSON.stringify(action.entity.object);

      client.cache.writeQuery({
        query: gql`{
          entity(id: "${perspectiveId}") {
            id
            ... on Perspective {
              head {
                id
              }
            }
            _context {
              raw
            }
          }
        }`,
        data: {
          entity: {
            __typename: 'Perspective',
            id: perspectiveId,
            head: {
              __typename: 'Commit',
              id: headId
            },
            _context: {
              __typename: 'EntityContext',
              raw
            }
          }
        }
      });
    } else if (action.entity) {
      entityCache.cacheEntity(action.entity);
    }
    if (action.type === UPDATE_HEAD_ACTION) {
      const perspectiveId = action.payload.perspectiveId;

      cacheUpdateRequest(client, perspectiveId, action.payload.newHeadId);
    }
  });

  return Promise.all(updateCachePromises);
}

export async function executeActions(
  actions: UprtclAction[],
  client: ApolloClient<any>,
  recognizer: PatternRecognizer
): Promise<void> {
  /** optimistic pre-fill the cache */
  const createDataPromises = actions
    .filter(a => a.type === CREATE_DATA_ACTION)
    .map(async (action: UprtclAction) => {
      if (!action.entity) throw new Error('entity undefined');

      const dataId = await createEntity(recognizer)(action.entity.object, action.payload.source);
      if (dataId !== action.entity.id) {
        throw new Error(`created entity id ${dataId} not as expected ${action.entity.id}`);
      }
    });

  await Promise.all(createDataPromises);

  const createCommitsPromises = actions
    .filter(a => a.type === CREATE_COMMIT_ACTION)
    .map(async (action: UprtclAction) => {
      if (!action.entity) throw new Error('entity undefined');
      const result = await client.mutate({
        mutation: CREATE_COMMIT,
        variables: {
          ...action.entity.object.payload,
          source: action.payload.source
        }
      });
      const headId = result.data.createCommit.id;
      if (headId !== action.entity.id) {
        throw new Error(`created commit id ${headId} not as expected ${action.entity.id}`);
      }
    });

  await Promise.all(createCommitsPromises);

  const createPerspectivesPromises = actions
    .filter(a => a.type === CREATE_AND_INIT_PERSPECTIVE_ACTION)
    .map(async (action: UprtclAction) => {
      if (!action.entity) throw new Error('entity undefined');
      
      const result = await client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          ...action.entity.object.payload,
          ...action.payload.details,
          authority: action.entity.object.payload.origin,
          canWrite: action.payload.owner
        }
      });
      if (result.data.createPerspective.id !== action.entity.id) {
        throw new Error(
          `created commit id ${result.data.createPerspective.id} not as expected ${action.entity.id}`
        );
      }
    });

  await Promise.all(createPerspectivesPromises);
}
